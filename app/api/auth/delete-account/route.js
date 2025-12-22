import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createAdminSupabaseClient } from "@/libs/supabase";
import Stripe from "stripe";

export async function DELETE(req) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const supabase = createAdminSupabaseClient();

        // 1. Get organization details to find Stripe Customer ID
        const { data: org, error: orgError } = await supabase
            .from("organizations")
            .select("id, stripe_customer_id")
            .eq("user_id", session.user.id)
            .single();

        if (orgError) {
            console.error("Error fetching org for deletion:", orgError);
            // Proceed to delete user anyway if org not found, to avoid being stuck
        }

        // 2. Cancel Stripe Customer (deletes subscriptions too)
        if (org?.stripe_customer_id) {
            try {
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
                await stripe.customers.del(org.stripe_customer_id);
                console.log(`Deleted Stripe customer: ${org.stripe_customer_id}`);
            } catch (stripeError) {
                console.error("Error deleting Stripe customer:", stripeError);
                // Don't block account deletion if Stripe fails (e.g. already deleted)
            }
        }

        // 3. Delete from Supabase Auth (This is the master switch)
        // Deleting the user from auth.users usually requires the service_role key
        const { error: deleteError } = await supabase.auth.admin.deleteUser(
            session.user.id
        );

        if (deleteError) {
            console.error("Error deleting auth user:", deleteError);
            return NextResponse.json(
                { error: "Failed to delete user account" },
                { status: 500 }
            );
        }

        // 4. Explicitly delete organization to ensure data cleanup (if cascade didn't catch it)
        if (org?.id) {
            await supabase.from("organizations").delete().eq("id", org.id);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete account error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
