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
            .select("*")
            .eq("user_id", session.user.id)
            .single();

        if (orgError || !org) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        let accountId = org.stripe_account_id;

        // 1. Create Stripe Account if not exists
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: "express",
                email: session.user.email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_type: "non_profit", // Default, can be changed in onboarding
                company: {
                    name: org.name,
                },
            });

            accountId = account.id;

            // Save to DB
            await supabase
                .from("organizations")
                .update({
                    stripe_account_id: accountId,
                    stripe_account_status: 'pending' // pending onboarding
                })
                .eq("id", org.id);
        }

        if (!process.env.NEXT_PUBLIC_APP_URL) {
            console.error("Missing NEXT_PUBLIC_APP_URL environment variable");
            return NextResponse.json({ error: "Server configuration error: Missing App URL" }, { status: 500 });
        }

        // 2. Create Account Link for onboarding
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?connect=refresh`,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?connect=success`,
            type: "account_onboarding",
        });

        return NextResponse.json({ url: accountLink.url });
    } catch (error) {
        console.error("Error creating Connect account:", error);
        return NextResponse.json({ error: error.message || "Failed to create connection" }, { status: 500 });
    }
}
