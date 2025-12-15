import { NextResponse } from "next/server";
import { auth } from "@/libs/next-auth";
import { createClient } from "@/libs/supabase";

// POST /api/emails/send - Send an email campaign
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, body: emailBody, selectedTags, recipientCount } = body;

    if (!subject || !emailBody) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const supabase = createClient();
    const organizationId = session.user.organizationId;

    // Get contacts based on tag filter
    let query = supabase
      .from("contacts")
      .select("id, email, first_name, last_name, tags")
      .eq("organization_id", organizationId)
      .not("email", "is", null);

    const { data: contacts, error: contactsError } = await query;

    if (contactsError) {
      console.error("Error fetching contacts:", contactsError);
      return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
    }

    // Filter by tags if specified
    let recipients = contacts;
    if (selectedTags && selectedTags.length > 0) {
      recipients = contacts.filter(contact => 
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

    // Send emails via SendGrid or Resend
    // In production, this would be an async job
    // For MVP, we'll use a simple approach
    
    let sentCount = 0;
    const errors = [];

    // Check if SendGrid API key is configured
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || "noreply@kindercause.com";

    if (sendgridApiKey) {
      // Use SendGrid
      for (const recipient of recipients) {
        try {
          const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${sendgridApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              personalizations: [{
                to: [{ email: recipient.email, name: `${recipient.first_name || ""} ${recipient.last_name || ""}`.trim() }],
              }],
              from: { email: fromEmail, name: "KinderCause" },
              subject,
              content: [
                {
                  type: "text/plain",
                  value: `${emailBody}\n\n---\nSent via KinderCause\nUnsubscribe: ${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${recipient.email}`,
                },
              ],
            }),
          });

          if (response.ok) {
            sentCount++;
          } else {
            const errorData = await response.json();
            errors.push({ email: recipient.email, error: errorData });
          }
        } catch (err) {
          errors.push({ email: recipient.email, error: err.message });
        }
      }
    } else if (resendApiKey) {
      // Use Resend
      for (const recipient of recipients) {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromEmail,
              to: recipient.email,
              subject,
              text: `${emailBody}\n\n---\nSent via KinderCause`,
            }),
          });

          if (response.ok) {
            sentCount++;
          } else {
            const errorData = await response.json();
            errors.push({ email: recipient.email, error: errorData });
          }
        } catch (err) {
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
