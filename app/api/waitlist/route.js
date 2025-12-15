import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase";

// POST /api/waitlist - Add someone to the waitlist
export async function POST(req) {
  try {
    const body = await req.json();
    const { firstName, daycareName, email } = body;

    // Validation
    if (!firstName || !firstName.trim()) {
      return NextResponse.json({ error: "First name is required" }, { status: 400 });
    }
    if (!daycareName || !daycareName.trim()) {
      return NextResponse.json({ error: "Daycare name is required" }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
    }

    const supabase = createClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from("waitlist")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: "You're already on the waitlist! We'll be in touch soon." 
      });
    }

    // Insert new waitlist entry
    const { error } = await supabase
      .from("waitlist")
      .insert({
        first_name: firstName.trim(),
        daycare_name: daycareName.trim(),
        email: email.toLowerCase().trim(),
      });

    if (error) {
      console.error("Waitlist insert error:", error);
      return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "You're on the list! We'll reach out soon with early access." 
    });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
