import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createAdminSupabaseClient } from "@/libs/supabase";

// POST /api/contacts/import - Import contacts from CSV/Excel data
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { contacts } = body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: "No contacts provided" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Get user's organization
    let { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!org) {
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert({
          user_id: session.user.id,
          name: session.user.name || "My Daycare",
          slug: session.user.email.split("@")[0] + "-" + Date.now().toString(36),
        })
        .select()
        .single();

      if (orgError) {
        return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
      }
      org = newOrg;
    }

    // Prepare contacts for insert
    const contactsToInsert = contacts.map((c) => {
      // Handle different column names (Name, name, First Name, first_name, etc.)
      let firstName = c.first_name || c.firstName || c["First Name"] || "";
      let lastName = c.last_name || c.lastName || c["Last Name"] || "";

      // If we have a combined name field, split it
      const fullName = c.name || c.Name || c["Full Name"] || "";
      if (fullName && !firstName) {
        const parts = fullName.trim().split(" ");
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ");
      }

      const email = (c.email || c.Email || c["Email Address"] || "").toLowerCase().trim();
      const phone = c.phone || c.Phone || c["Phone Number"] || null;

      // Handle tags - could be string or array
      let tags = c.tags || c.Tags || [];
      if (typeof tags === "string") {
        tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      }

      return {
        organization_id: org.id,
        first_name: firstName,
        last_name: lastName || null,
        email,
        phone,
        tags,
      };
    }).filter((c) => c.email && c.first_name); // Filter out invalid entries

    if (contactsToInsert.length === 0) {
      return NextResponse.json(
        { error: "No valid contacts found. Each contact needs at least a name and email." },
        { status: 400 }
      );
    }

    // Insert contacts, handling duplicates
    const { data: insertedContacts, error } = await supabase
      .from("contacts")
      .upsert(contactsToInsert, {
        onConflict: "organization_id,email",
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error("Error importing contacts:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imported: insertedContacts?.length || contactsToInsert.length,
      total: contacts.length,
    });
  } catch (error) {
    console.error("Error in POST /api/contacts/import:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
