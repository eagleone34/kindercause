import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createAdminSupabaseClient } from "@/libs/supabase";

// GET /api/organization - Get the user's organization
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createAdminSupabaseClient();

        const { data: org, error } = await supabase
            .from("organizations")
            .select("*")
            .eq("user_id", session.user.id)
            .single();

        if (error || !org) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        return NextResponse.json(org);
    } catch (error) {
        console.error("Error in GET /api/organization:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/organization - Update the user's organization
export async function PUT(req) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, phone, website, address, city, state, zip } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Organization name is required" },
                { status: 400 }
            );
        }

        const supabase = createAdminSupabaseClient();

        // Get existing org
        const { data: existingOrg } = await supabase
            .from("organizations")
            .select("id")
            .eq("user_id", session.user.id)
            .single();

        if (!existingOrg) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        // Update organization
        const { data: org, error } = await supabase
            .from("organizations")
            .update({
                name,
                phone: phone || null,
                website: website || null,
                address: address || null,
                city: city || null,
                state: state || null,
                zip: zip || null,
                fund_categories: body.fund_categories || undefined,
            })
            .eq("id", existingOrg.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(org);
    } catch (error) {
        console.error("Error in PUT /api/organization:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
