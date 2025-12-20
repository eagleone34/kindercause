import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createAdminSupabaseClient } from "@/libs/supabase";

// Helper function to get organization ID
async function getOrganizationId(supabase, userId) {
  const { data: org, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error || !org) return null;
  return org.id;
}

// GET /api/emails/[id] - Get a single email campaign
export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminSupabaseClient();

    const organizationId = await getOrganizationId(supabase, session.user.id);
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { data: campaign, error } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (error || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Error in GET /api/emails/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/emails/[id] - Update an email campaign (draft only)
export async function PUT(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { subject, body: emailBody, selectedTags } = body;

    const supabase = createAdminSupabaseClient();

    const organizationId = await getOrganizationId(supabase, session.user.id);
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // First check if campaign exists and is a draft
    const { data: existingCampaign, error: fetchError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (fetchError || !existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (existingCampaign.status !== "draft") {
      return NextResponse.json({ error: "Can only edit draft campaigns" }, { status: 400 });
    }

    // Update the campaign
    const { data: campaign, error } = await supabase
      .from("email_campaigns")
      .update({
        subject: subject || existingCampaign.subject,
        body: emailBody !== undefined ? emailBody : existingCampaign.body,
        filter_tags: selectedTags || existingCampaign.filter_tags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating campaign:", error);
      return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Error in PUT /api/emails/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/emails/[id] - Delete an email campaign
export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminSupabaseClient();

    const organizationId = await getOrganizationId(supabase, session.user.id);
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("email_campaigns")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error deleting campaign:", error);
      return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/emails/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
