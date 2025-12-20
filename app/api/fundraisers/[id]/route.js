import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createAdminSupabaseClient } from "@/libs/supabase";

// GET /api/fundraisers/[id] - Get a specific fundraiser
export async function GET(req, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const supabase = createAdminSupabaseClient();

        // Get the user's organization (including slug for public URLs)
        const { data: org } = await supabase
            .from("organizations")
            .select("id, slug, name")
            .eq("user_id", session.user.id)
            .single();

        if (!org) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        // Get the fundraiser
        const { data: fundraiser, error } = await supabase
            .from("fundraisers")
            .select("*")
            .eq("id", id)
            .eq("organization_id", org.id)
            .single();

        if (error || !fundraiser) {
            return NextResponse.json({ error: "Fundraiser not found" }, { status: 404 });
        }

        // Return fundraiser with org info for building public URLs
        return NextResponse.json({
            ...fundraiser,
            organization: {
                slug: org.slug,
                name: org.name,
            },
        });
    } catch (error) {
        console.error("Error in GET /api/fundraisers/[id]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/fundraisers/[id] - Update a fundraiser
export async function PUT(req, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
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

        // Update the fundraiser
        const { data: fundraiser, error } = await supabase
            .from("fundraisers")
            .update(body)
            .eq("id", id)
            .eq("organization_id", org.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(fundraiser);
    } catch (error) {
        console.error("Error in PUT /api/fundraisers/[id]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/fundraisers/[id] - Delete a fundraiser
export async function DELETE(req, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
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

        // Check if fundraiser has any purchases
        const { count: purchaseCount } = await supabase
            .from("purchases")
            .select("id", { count: "exact", head: true })
            .eq("fundraiser_id", id);

        if (purchaseCount && purchaseCount > 0) {
            return NextResponse.json(
                { error: "Cannot delete fundraiser with transactions. Deactivate it instead." },
                { status: 400 }
            );
        }

        // Delete the fundraiser (only if no purchases)
        const { error } = await supabase
            .from("fundraisers")
            .delete()
            .eq("id", id)
            .eq("organization_id", org.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in DELETE /api/fundraisers/[id]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
