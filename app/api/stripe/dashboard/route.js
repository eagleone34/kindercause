import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createAdminSupabaseClient } from "@/libs/supabase";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createAdminSupabaseClient();

        // Get organization
        const { data: org, error: orgError } = await supabase
            .from("organizations")
            .select("stripe_account_id")
            .eq("user_id", session.user.id)
            .single();

        if (orgError || !org?.stripe_account_id) {
            return NextResponse.json({ error: "Stripe connection not found" }, { status: 404 });
        }

        // Create Login Link
        const loginLink = await stripe.accounts.createLoginLink(org.stripe_account_id);

        return NextResponse.json({ url: loginLink.url });
    } catch (error) {
        console.error("Error creating dashboard link:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
