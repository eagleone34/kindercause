import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createAdminSupabaseClient } from "@/libs/supabase";

// Default groups - these are available to all organizations
const DEFAULT_GROUPS = [
    "Parents",
    "Volunteers",
    "Donors",
    "Board Members",
    "Alumni",
    "Staff",
    "Sponsors",
    "Other",
];

// GET /api/groups - Get all groups for the user's organization
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createAdminSupabaseClient();

        // Get the user's organization
        const { data: org } = await supabase
            .from("organizations")
            .select("id, custom_groups")
            .eq("user_id", session.user.id)
            .single();

        // Combine default groups with custom groups
        const customGroups = org?.custom_groups || [];
        const allGroups = [...DEFAULT_GROUPS, ...customGroups];

        return NextResponse.json({
            groups: allGroups,
            defaultGroups: DEFAULT_GROUPS,
            customGroups: customGroups,
        });
    } catch (error) {
        console.error("Error in GET /api/groups:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/groups - Add a new custom group
export async function POST(req) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name } = body;

        if (!name || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Group name is required" },
                { status: 400 }
            );
        }

        const groupName = name.trim();

        // Check if it's a default group name
        if (DEFAULT_GROUPS.map(g => g.toLowerCase()).includes(groupName.toLowerCase())) {
            return NextResponse.json(
                { error: "This group already exists" },
                { status: 400 }
            );
        }

        const supabase = createAdminSupabaseClient();

        // Get the user's organization
        const { data: org } = await supabase
            .from("organizations")
            .select("id, custom_groups")
            .eq("user_id", session.user.id)
            .single();

        if (!org) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        const customGroups = org.custom_groups || [];

        // Check if custom group already exists
        if (customGroups.map(g => g.toLowerCase()).includes(groupName.toLowerCase())) {
            return NextResponse.json(
                { error: "This group already exists" },
                { status: 400 }
            );
        }

        // Add the new group
        const updatedGroups = [...customGroups, groupName];

        const { error } = await supabase
            .from("organizations")
            .update({ custom_groups: updatedGroups })
            .eq("id", org.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            groups: [...DEFAULT_GROUPS, ...updatedGroups],
        });
    } catch (error) {
        console.error("Error in POST /api/groups:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/groups - Remove a custom group
export async function DELETE(req) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const name = searchParams.get("name");

        if (!name) {
            return NextResponse.json(
                { error: "Group name is required" },
                { status: 400 }
            );
        }

        // Cannot delete default groups
        if (DEFAULT_GROUPS.includes(name)) {
            return NextResponse.json(
                { error: "Cannot delete default groups" },
                { status: 400 }
            );
        }

        const supabase = createAdminSupabaseClient();

        // Get the user's organization
        const { data: org } = await supabase
            .from("organizations")
            .select("id, custom_groups")
            .eq("user_id", session.user.id)
            .single();

        if (!org) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        const customGroups = org.custom_groups || [];
        const updatedGroups = customGroups.filter(g => g !== name);

        const { error } = await supabase
            .from("organizations")
            .update({ custom_groups: updatedGroups })
            .eq("id", org.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in DELETE /api/groups:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
