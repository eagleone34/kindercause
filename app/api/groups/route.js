import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createAdminSupabaseClient } from "@/libs/supabase";

// Default groups - used to initialize new organizations
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

        // If org has custom_groups set, use those. Otherwise use defaults
        const groups = org?.custom_groups?.length > 0 ? org.custom_groups : DEFAULT_GROUPS;

        return NextResponse.json({
            groups: groups,
            defaultGroups: DEFAULT_GROUPS,
        });
    } catch (error) {
        console.error("Error in GET /api/groups:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/groups - Add a new group
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

        // Use existing custom_groups or default groups
        const currentGroups = org.custom_groups?.length > 0 ? org.custom_groups : [...DEFAULT_GROUPS];

        // Check if group already exists
        if (currentGroups.map(g => g.toLowerCase()).includes(groupName.toLowerCase())) {
            return NextResponse.json(
                { error: "This group already exists" },
                { status: 400 }
            );
        }

        // Add the new group
        const updatedGroups = [...currentGroups, groupName];

        const { error } = await supabase
            .from("organizations")
            .update({ custom_groups: updatedGroups })
            .eq("id", org.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            groups: updatedGroups,
        });
    } catch (error) {
        console.error("Error in POST /api/groups:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/groups - Remove any group
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

        // Check if any contacts are using this group
        const { data: contactsWithGroup, error: checkError } = await supabase
            .from("contacts")
            .select("id")
            .eq("organization_id", org.id)
            .contains("tags", [name])
            .limit(1);

        if (checkError) {
            console.error("Error checking contacts:", checkError);
            return NextResponse.json({ error: "Failed to check group usage" }, { status: 500 });
        }

        if (contactsWithGroup && contactsWithGroup.length > 0) {
            return NextResponse.json(
                { error: `Cannot delete "${name}" - this group is assigned to one or more contacts. Please remove this group from all contacts first.` },
                { status: 400 }
            );
        }

        // Use existing custom_groups or default groups
        const currentGroups = org.custom_groups?.length > 0 ? org.custom_groups : [...DEFAULT_GROUPS];
        const updatedGroups = currentGroups.filter(g => g !== name);

        const { error } = await supabase
            .from("organizations")
            .update({ custom_groups: updatedGroups })
            .eq("id", org.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, groups: updatedGroups });
    } catch (error) {
        console.error("Error in DELETE /api/groups:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
