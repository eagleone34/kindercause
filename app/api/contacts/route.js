import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createAdminSupabaseClient } from "@/libs/supabase";

// GET /api/contacts - List all contacts for the user's organization
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching contacts for user:", session.user.id);

    const supabase = createAdminSupabaseClient();

    // Get the user's organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    console.log("Organization query result:", { org, orgError });

    if (orgError) {
      console.error("Error fetching organization:", orgError);
      return NextResponse.json({ contacts: [] });
    }

    if (!org || !org.id) {
      console.log("No organization or org.id found for user:", session.user.id);
      return NextResponse.json({ contacts: [] });
    }

    console.log("Fetching contacts for org:", org.id);

    // Get contacts
    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching contacts:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter out unsubscribed contacts if the field exists
    const activeContacts = contacts?.filter(c => c.unsubscribed !== true) || [];

    console.log("Returning", activeContacts.length, "contacts");
    return NextResponse.json({ contacts: activeContacts });
  } catch (error) {
    console.error("Error in GET /api/contacts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/contacts - Create a single contact
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { first_name, last_name, name, email, phone, tags, children } = body;

    // Support both name (combined) and first_name/last_name (separate)
    let firstName = first_name;
    let lastName = last_name;

    if (name && !firstName) {
      const nameParts = name.trim().split(" ");
      firstName = nameParts[0];
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;
    }

    if (!firstName || !email) {
      return NextResponse.json(
        { error: "First name and email are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Get or create organization
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

    // Create contact with children
    const { data: contact, error } = await supabase
      .from("contacts")
      .insert({
        organization_id: org.id,
        first_name: firstName,
        last_name: lastName || null,
        email: email.toLowerCase().trim(),
        phone: phone || null,
        tags: tags || [],
        children: children || [],
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Contact with this email already exists" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/contacts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
