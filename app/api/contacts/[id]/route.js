import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createAdminSupabaseClient } from "@/libs/supabase";

// GET /api/contacts/[id] - Get a single contact
export async function GET(req, { params }) {
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

        // Get the contact
        const { data: contact, error } = await supabase
            .from("contacts")
            .select("*")
            .eq("id", id)
            .eq("organization_id", org.id)
            .single();

        if (error || !contact) {
            return NextResponse.json({ error: "Contact not found" }, { status: 404 });
        }

        return NextResponse.json(contact);
    } catch (error) {
        console.error("Error in GET /api/contacts/[id]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/contacts/[id] - Update a contact
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

        // Update the contact
        const { data: contact, error } = await supabase
            .from("contacts")
            .update({
                first_name: body.first_name,
                last_name: body.last_name || null,
                email: body.email?.toLowerCase().trim(),
                phone: body.phone || null,
                tags: body.tags || [],
            })
            .eq("id", id)
            .eq("organization_id", org.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(contact);
    } catch (error) {
        console.error("Error in PUT /api/contacts/[id]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/contacts/[id] - Delete a contact
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

        // Delete the contact
        const { error } = await supabase
            .from("contacts")
            .delete()
            .eq("id", id)
            .eq("organization_id", org.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in DELETE /api/contacts/[id]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
