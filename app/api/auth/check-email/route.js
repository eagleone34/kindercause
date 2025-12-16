import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/libs/supabase";

export async function POST(req) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const supabase = createAdminSupabaseClient();

        // Check if user exists in next_auth.users table
        const { data, error } = await supabase
            .schema("next_auth")
            .from("users")
            .select("id")
            .eq("email", email)
            .single();

        if (error && error.code !== "PGRST116") { // PGRST116 is "Row not found" (0 rows)
            console.error("Error checking user:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        return NextResponse.json({ exists: !!data });
    } catch (error) {
        console.error("Check email error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
