import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase";

// This route is used to store the leads that are generated from the landing page.
// The API call is initiated by <ButtonLead /> component
// Duplicate emails just return 200 OK
export async function POST(req) {
  const body = await req.json();

  if (!body.email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const supabase = createClient();
    
    // Check if lead already exists
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("email", body.email)
      .single();

    if (!existingLead) {
      // Create new lead
      await supabase
        .from("leads")
        .insert({ email: body.email });
    }

    return NextResponse.json({});
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
