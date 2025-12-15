import { NextResponse } from "next/server";
import { auth } from "@/libs/next-auth";
import { createClient } from "@/libs/supabase";

// GET /api/emails - List email campaigns
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient();
    
    const { data: campaigns, error } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("organization_id", session.user.organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching campaigns:", error);
      return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
    }

    return NextResponse.json({ campaigns: campaigns || [] });
  } catch (error) {
    console.error("Error in GET /api/emails:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/emails - Create a new email campaign (draft)
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, body: emailBody, selectedTags, status = "draft" } = body;

    if (!subject) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }

    const supabase = createClient();
    
    const { data: campaign, error } = await supabase
      .from("email_campaigns")
      .insert({
        organization_id: session.user.organizationId,
        subject,
        body: emailBody || "",
        filter_tags: selectedTags || [],
        status,
        recipient_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating campaign:", error);
      return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Error in POST /api/emails:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
