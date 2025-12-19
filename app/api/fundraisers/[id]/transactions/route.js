import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createAdminSupabaseClient } from "@/libs/supabase";

// GET /api/fundraisers/[id]/transactions - Get transactions for a fundraiser
export async function GET(req, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(req.url);

        // Filter params
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        const supabase = createAdminSupabaseClient();

        // Get the user's organization
        const { data: org } = await supabase
            .from("organizations")
            .select("id")
            .eq("user_id", session.user.id)
            .single();

        if (!org) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        // Verify fundraiser belongs to org
        const { data: fundraiser } = await supabase
            .from("fundraisers")
            .select("id, organization_id")
            .eq("id", id)
            .eq("organization_id", org.id)
            .single();

        if (!fundraiser) {
            return NextResponse.json({ error: "Fundraiser not found" }, { status: 404 });
        }

        // Build query
        let query = supabase
            .from("purchases")
            .select("*", { count: "exact" })
            .eq("fundraiser_id", id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (status && status !== "all") {
            query = query.eq("status", status);
        }

        if (search) {
            query = query.or(`purchaser_name.ilike.%${search}%,purchaser_email.ilike.%${search}%`);
        }

        const { data: transactions, error, count } = await query;

        if (error) {
            console.error("Error fetching transactions:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            transactions,
            total: count,
            limit,
            offset,
        });
    } catch (error) {
        console.error("Error in GET /api/fundraisers/[id]/transactions:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
