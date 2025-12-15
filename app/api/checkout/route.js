import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminSupabaseClient } from "@/libs/supabase";
import config from "@/config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const body = await req.json();
    const { fundraiserId, type, quantity = 1, amount, isRecurring = false } = body;

    if (!fundraiserId || !type || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Fetch fundraiser details
    const { data: fundraiser, error: fundraiserError } = await supabase
      .from("fundraisers")
      .select(`
        *,
        organizations!inner(
          id,
          name,
          slug,
          stripe_account_id
        )
      `)
      .eq("id", fundraiserId)
      .eq("status", "active")
      .single();

    if (fundraiserError || !fundraiser) {
      return NextResponse.json(
        { error: "Fundraiser not found or not active" },
        { status: 404 }
      );
    }

    const org = fundraiser.organizations;
    const isEvent = type === "ticket";

    // Validate event capacity
    if (isEvent && fundraiser.capacity) {
      const remaining = fundraiser.capacity - fundraiser.tickets_sold;
      if (quantity > remaining) {
        return NextResponse.json(
          { error: `Only ${remaining} tickets remaining` },
          { status: 400 }
        );
      }
    }

    // Calculate fees
    const platformFeePercent = config.stripe.platformFeePercent / 100;
    const platformFee = Math.round(amount * platformFeePercent * 100); // in cents

    // Build line items
    const lineItems = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: isEvent
              ? `${fundraiser.name} - Ticket`
              : `Donation to ${fundraiser.name}`,
            description: org.name,
            metadata: {
              fundraiser_id: fundraiser.id,
              organization_id: org.id,
            },
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
          ...(isRecurring && {
            recurring: {
              interval: "month",
            },
          }),
        },
        quantity: isEvent ? quantity : 1,
      },
    ];

    // Build success/cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/${org.slug}/${fundraiser.slug}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/${org.slug}/${fundraiser.slug}`;

    // Create Stripe Checkout Session
    const sessionParams = {
      mode: isRecurring ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        fundraiser_id: fundraiser.id,
        organization_id: org.id,
        type: type,
        quantity: quantity.toString(),
      },
      // Collect customer info
      billing_address_collection: "auto",
      customer_creation: "always",
      // Custom fields for name
      custom_fields: [
        {
          key: "name",
          label: { type: "custom", custom: "Your Name" },
          type: "text",
        },
      ],
      // Phone collection
      phone_number_collection: {
        enabled: true,
      },
    };

    // If organization has Stripe Connect, use application fee
    if (org.stripe_account_id) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: org.stripe_account_id,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
