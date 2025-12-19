import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createAdminSupabaseClient } from "@/libs/supabase";

// Helper to generate URL-friendly slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 50);
}

// GET /api/fundraisers - List all fundraisers for the user's organization
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();

    // First get the user's organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (orgError || !org) {
      // No organization yet - return empty list
      return NextResponse.json({ fundraisers: [] });
    }

    // Get fundraisers for this organization
    const { data: fundraisers, error } = await supabase
      .from("fundraisers")
      .select("*")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching fundraisers:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ fundraisers });
  } catch (error) {
    console.error("Error in GET /api/fundraisers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/fundraisers - Create a new fundraiser
export async function POST(req) {
  try {
    const session = await auth();
    console.log("Fundraisers API - session:", JSON.stringify(session, null, 2));
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      type,
      description,
      start_date,
      end_date,
      ticket_price,
      capacity,
      location,
      goal_amount,
      allow_recurring,
      show_donor_wall,
      send_tax_receipts,
    } = body;

    // Validate required fields
    if (!name || !type || !start_date) {
      return NextResponse.json(
        { error: "Name, type, and start date are required" },
        { status: 400 }
      );
    }

    if (type === "event" && !ticket_price) {
      return NextResponse.json(
        { error: "Ticket price is required for events" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Get or create organization for this user
    let { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, slug")
      .eq("user_id", session.user.id)
      .single();

    if (orgError || !org) {
      // Create a default organization for the user
      const orgSlug = generateSlug(session.user.name || session.user.email.split("@")[0]);
      const { data: newOrg, error: createOrgError } = await supabase
        .from("organizations")
        .insert({
          user_id: session.user.id,
          name: session.user.name || "My Daycare",
          slug: orgSlug + "-" + Date.now().toString(36),
        })
        .select()
        .single();

      if (createOrgError) {
        console.error("Error creating organization:", createOrgError);
        return NextResponse.json(
          { error: "Failed to create organization" },
          { status: 500 }
        );
      }
      org = newOrg;
    }

    // Generate unique slug for fundraiser
    const baseSlug = generateSlug(name);
    const slug = baseSlug + "-" + Date.now().toString(36);

    // Create the fundraiser
    const fundraiserData = {
      organization_id: org.id,
      name,
      slug,
      type,
      description: description || null,
      start_date: new Date(start_date).toISOString(),
      end_date: end_date ? new Date(end_date).toISOString() : null,
      status: "draft",
    };

    if (type === "event") {
      fundraiserData.ticket_price = parseFloat(ticket_price);
      fundraiserData.capacity = capacity ? parseInt(capacity) : null;
      fundraiserData.location = location || null;
    } else {
      fundraiserData.goal_amount = goal_amount ? parseFloat(goal_amount) : null;
      fundraiserData.allow_recurring = allow_recurring || false;
      fundraiserData.show_donor_wall = show_donor_wall || false;
      fundraiserData.send_tax_receipts = send_tax_receipts || false;
    }

    const { data: fundraiser, error: createError } = await supabase
      .from("fundraisers")
      .insert(fundraiserData)
      .select()
      .single();

    if (createError) {
      console.error("Error creating fundraiser:", createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(fundraiser, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/fundraisers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
