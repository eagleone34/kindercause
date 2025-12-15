import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createAdminSupabaseClient } from "@/libs/supabase";

// GET /api/contacts - List all contacts for the user's organization
export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();

    // Get the user's organization
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!org) {
      return NextResponse.json({ contacts: [] });
    }

    // Get contacts
    const { data: contacts, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("organization_id", org.id)
      .eq("unsubscribed", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching contacts:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contacts });
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
    const { name, email, phone, tags } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
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

    // Create contact
    const { data: contact, error } = await supabase
      .from("contacts")
      .insert({
        organization_id: org.id,
        name,
        email: email.toLowerCase().trim(),
        phone: phone || null,
        tags: tags || [],
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
