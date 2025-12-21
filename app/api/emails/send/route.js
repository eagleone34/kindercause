import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createAdminSupabaseClient } from "@/libs/supabase";

// Helper function to replace variables in text for a specific recipient
function replaceVariables(text, recipient, organization, fundraiser) {
  if (!text) return text;

  let result = text;

  // Recipient variables
  result = result.replace(/\{\{first_name\}\}/g, recipient.first_name || "");
  result = result.replace(/\{\{last_name\}\}/g, recipient.last_name || "");

  // Child variables
  if (recipient.children && Array.isArray(recipient.children) && recipient.children.length > 0) {
    const validChildren = recipient.children.filter(c => c.name);
    if (validChildren.length > 0) {
      const names = validChildren.map(c => c.name).join(" and ");
      result = result.replace(/\{\{child_names\}\}/g, names);
      result = result.replace(/\{\{child_first_name\}\}/g, validChildren[0].name);
    } else {
      result = result.replace(/\{\{child_names\}\}/g, "your child");
      result = result.replace(/\{\{child_first_name\}\}/g, "your child");
    }
  } else {
    // Fallback if no children data
    result = result.replace(/\{\{child_names\}\}/g, "your child");
    result = result.replace(/\{\{child_first_name\}\}/g, "your child");
  }

  // Organization variables
  if (organization) {
    result = result.replace(/\{\{organization_name\}\}/g, organization.name || "");
  }

  // Fundraiser/Event variables
  if (fundraiser) {
    result = result.replace(/\{\{event_name\}\}/g, fundraiser.name || "");
    result = result.replace(/\{\{event_start_date\}\}/g,
      fundraiser.start_date ? new Date(fundraiser.start_date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      }) : ""
    );
    result = result.replace(/\{\{event_end_date\}\}/g,
      fundraiser.end_date ? new Date(fundraiser.end_date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      }) : ""
    );
    // Legacy support for {{event_date}}
    result = result.replace(/\{\{event_date\}\}/g,
      fundraiser.start_date ? new Date(fundraiser.start_date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      }) : ""
    );
    result = result.replace(/\{\{event_location\}\}/g, fundraiser.location || "");
    result = result.replace(/\{\{ticket_price\}\}/g, fundraiser.ticket_price?.toString() || "");

    // Fund allocation visualization
    if (text.includes("{{fund_allocation}}")) {
      let allocationText = "";
      if (fundraiser.fund_allocation && fundraiser.fund_allocation.length > 0) {
        allocationText = fundraiser.fund_allocation.map(item => {
          const bars = Math.round((item.percentage || 0) / 5); // 20 bars = 100%
          const progressBar = "█".repeat(bars) + "░".repeat(20 - bars);
          return `${item.category}: ${item.percentage}%\n${progressBar}`;
        }).join("\n\n");
      } else {
        // Default to General Fund 100%
        const progressBar = "█".repeat(20);
        allocationText = `General Fund: 100%\n${progressBar}`;
      }
      result = result.replace(/\{\{fund_allocation\}\}/g, allocationText);
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.kindercause.com"}/${organization?.slug || ""}/${fundraiser.slug || ""}`;
    result = result.replace(/\{\{purchase_link\}\}/g, publicUrl);
    result = result.replace(/\{\{donate_link\}\}/g, publicUrl);
  }

  return result;
}

// POST /api/emails/send - Send an email campaign
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, body: emailBody, selectedTags, fundraiserId } = body;

    if (!subject || !emailBody) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    // Get the user's organization (with slug for building URLs)
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, slug")
      .eq("user_id", session.user.id)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const organizationId = org.id;

    // Get the fundraiser if one was selected
    let fundraiser = null;
    if (fundraiserId) {
      const { data: fr } = await supabase
        .from("fundraisers")
        .select("*")
        .eq("id", fundraiserId)
        .eq("organization_id", organizationId)
        .single();
      fundraiser = fr;
    }

    // Get contacts based on tag filter
    let query = supabase
      .from("contacts")
      .select("id, email, first_name, last_name, tags, children")
      .eq("organization_id", organizationId)
      .not("email", "is", null);

    const { data: contacts, error: contactsError } = await query;

    if (contactsError) {
      console.error("Error fetching contacts:", contactsError);
      return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
    }

    // Filter by tags if specified
    let recipients = contacts || [];
    if (selectedTags && selectedTags.length > 0) {
      recipients = recipients.filter(contact =>
        selectedTags.some(tag => contact.tags?.includes(tag))
      );
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    // Create the campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .insert({
        organization_id: organizationId,
        subject,
        body: emailBody,
        filter_tags: selectedTags || [],
        status: "sending",
        recipient_count: recipients.length,
      })
      .select()
      .single();

    if (campaignError) {
      console.error("Error creating campaign:", campaignError);
      return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
    }

    // Send emails via Resend
    let sentCount = 0;
    const errors = [];

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || "noreply@kindercause.com";

    if (resendApiKey) {
      // Use Resend
      for (const recipient of recipients) {
        try {
          // Replace variables for this specific recipient
          const personalizedSubject = replaceVariables(subject, recipient, org, fundraiser);
          const personalizedBody = replaceVariables(emailBody, recipient, org, fundraiser);

          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromEmail,
              to: recipient.email,
              subject: personalizedSubject,
              text: `${personalizedBody}\n\n---\nSent via KinderCause`,
            }),
          });

          if (response.ok) {
            sentCount++;
          } else {
            const errorData = await response.json();
            console.error("Resend error:", errorData);
            errors.push({ email: recipient.email, error: errorData });
          }
        } catch (err) {
          console.error("Send error:", err);
          errors.push({ email: recipient.email, error: err.message });
        }
      }
    } else {
      // No email provider configured - log for development
      console.log("No email provider configured. Would send to:", recipients.length, "contacts");
      console.log("Subject:", subject);
      console.log("Body:", emailBody);
      sentCount = recipients.length; // Simulate success for development
    }

    // Update campaign status
    const { error: updateError } = await supabase
      .from("email_campaigns")
      .update({
        status: errors.length === 0 ? "sent" : "sent",
        sent_at: new Date().toISOString(),
        sent_count: sentCount,
        recipient_count: recipients.length,
      })
      .eq("id", campaign.id);

    if (updateError) {
      console.error("Error updating campaign:", updateError);
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      total: recipients.length,
      campaignId: campaign.id,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in POST /api/emails/send:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
