import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createAdminSupabaseClient } from "@/libs/supabase";

// POST /api/contacts/import - Bulk import contacts from CSV
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
        return NextResponse.json(
          { error: "Failed to create organization" },
          { status: 500 }
        );
      }
      org = newOrg;
    }

    // Prepare contacts for insertion
    const contactsToInsert = contacts.map((c) => ({
      organization_id: org.id,
      name: c.name || c.email.split("@")[0],
      email: c.email.toLowerCase().trim(),
      phone: c.phone || null,
      tags: c.tags || [],
    }));

    // Use upsert to handle duplicates (update existing, insert new)
    const { data: insertedContacts, error } = await supabase
      .from("contacts")
      .upsert(contactsToInsert, {
        onConflict: "organization_id,email",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error("Import error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats
    const imported = insertedContacts?.length || 0;
    const skipped = contacts.length - imported;

    return NextResponse.json({
      imported,
      skipped,
      total: contacts.length,
    });
  } catch (error) {
    console.error("Error in POST /api/contacts/import:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
