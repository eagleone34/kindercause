import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createAdminSupabaseClient } from "@/libs/supabase";
import configFile from "@/config";

// Initialize Stripe only if the secret key is available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Stripe webhook handler for KinderCause
// Handles both subscription payments (for SaaS) and one-time payments (tickets/donations)
export async function POST(req) {
  // Check if Stripe is configured
  if (!stripe || !webhookSecret) {
    console.error(
      "Stripe is not configured properly. Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET"
    );
    return NextResponse.json(
      { error: "Stripe configuration missing" },
      { status: 500 }
    );
  }

  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  let event;

  // Verify Stripe event is legit
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed. ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const data = event.data;
  const eventType = event.type;

  const supabase = createAdminSupabaseClient();

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        const session = data.object;
        const metadata = session.metadata || {};

        // Check if this is a fundraiser purchase (ticket/donation)
        if (metadata.fundraiser_id) {
          await handleFundraiserPurchase(session, supabase);
        } else {
          // This is a SaaS subscription - handle user access
          await handleSubscriptionPurchase(session, supabase, stripe);
        }
        break;
      }

      case "checkout.session.expired": {
        // User didn't complete the transaction
        // Could send reminder email
        break;
      }

      case "customer.subscription.updated": {
        // Subscription changed (upgrade/downgrade/cancel pending)
        break;
      }

      case "customer.subscription.deleted": {
        // Subscription canceled - revoke access
        const subscription = data.object;
        await handleSubscriptionCanceled(subscription, supabase);
        break;
      }

      case "invoice.paid": {
        // Recurring payment successful
        const invoice = data.object;
        await handleInvoicePaid(invoice, supabase);
        break;
      }

      case "invoice.payment_failed": {
        // Payment failed - could send warning email
        break;
      }

      case "charge.refunded": {
        // Handle refunds
        const charge = data.object;
        await handleRefund(charge, supabase);
        break;
      }

      default:
      // Unhandled event type
    }
  } catch (e) {
    console.error(
      "Stripe webhook error: " + e.message + " | EVENT TYPE: " + eventType
    );
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// Handle ticket/donation purchases
async function handleFundraiserPurchase(session, supabase) {
  const metadata = session.metadata;
  const fundraiserId = metadata.fundraiser_id;
  const type = metadata.type; // "ticket" or "donation"
  const quantity = parseInt(metadata.quantity) || 1;

  // Get customer details
  const customer = session.customer_details;
  const customFields = session.custom_fields || [];
  const nameField = customFields.find((f) => f.key === "name");
  const purchaserName = nameField?.text?.value || customer?.name || "Anonymous";

  // Calculate amounts
  const amountTotal = session.amount_total / 100; // Convert from cents
  const stripeFee = amountTotal * 0.029 + 0.3; // Stripe's fee
  const platformFee = amountTotal * (configFile.stripe.platformFeePercent / 100);
  const netAmount = amountTotal - stripeFee - platformFee;

  // Generate QR code data for tickets
  const qrCodeData =
    type === "ticket"
      ? `KC-${fundraiserId.slice(0, 8)}-${Date.now().toString(36)}`
      : null;

  // Insert purchase record
  const { error: purchaseError } = await supabase.from("purchases").insert({
    fundraiser_id: fundraiserId,
    purchaser_name: purchaserName,
    purchaser_email: customer?.email,
    purchaser_phone: customer?.phone,
    amount: amountTotal,
    quantity: quantity,
    stripe_fee: stripeFee,
    platform_fee: platformFee,
    net_amount: netAmount,
    stripe_payment_id: session.payment_intent,
    stripe_customer_id: session.customer,
    stripe_checkout_session_id: session.id,
    is_recurring: session.mode === "subscription",
    stripe_subscription_id:
      session.mode === "subscription" ? session.subscription : null,
    qr_code_data: qrCodeData,
    status: "completed",
    metadata: {
      type: type,
      customer_details: customer,
    },
  });

  if (purchaseError) {
    console.error("Error recording purchase:", purchaseError);
    throw purchaseError;
  }

  // TODO: Send confirmation email with QR code (for events)
  // TODO: Send tax receipt (for donations to nonprofits)

  console.log(
    `✅ Recorded ${type} purchase: $${amountTotal} for fundraiser ${fundraiserId}`
  );
}

// Handle SaaS subscription purchases
async function handleSubscriptionPurchase(session, supabase, stripe) {
  const customerId = session.customer;
  // const customer = await stripe.customers.retrieve(customerId);

  // Get the price ID from line items
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
  const priceId = lineItems.data[0]?.price?.id;

  // Find the plan
  const plan = configFile.stripe.plans.find((p) => p.priceId === priceId);
  if (!plan) {
    console.log("No matching plan found for priceId:", priceId);
    return;
  }

  // Update or create organization with subscription info
  const userId = session.client_reference_id;

  if (userId) {
    const { error } = await supabase
      .from("organizations")
      .update({
        stripe_customer_id: customerId,
        subscription_status: "active",
        price_id: priceId,
        plan_name: plan.name,
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating organization:", error);
    }
  }

  console.log(`✅ Subscription activated: ${plan.name} for customer ${customerId}`);
}

// Handle subscription cancellation
async function handleSubscriptionCanceled(subscription, supabase) {
  const customerId = subscription.customer;

  const { error } = await supabase
    .from("organizations")
    .update({
      subscription_status: "canceled",
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("Error updating canceled subscription:", error);
  }

  console.log(`❌ Subscription canceled for customer ${customerId}`);
}

// Handle recurring invoice payments
async function handleInvoicePaid(invoice, supabase) {
  const customerId = invoice.customer;

  // Update subscription status to active (in case it was past_due)
  const { error } = await supabase
    .from("organizations")
    .update({
      subscription_status: "active",
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("Error updating invoice paid:", error);
  }
}

// Handle refunds
async function handleRefund(charge, supabase) {
  const paymentIntentId = charge.payment_intent;

  if (!paymentIntentId) return;

  // Update purchase status to refunded
  const { error } = await supabase
    .from("purchases")
    .update({
      status: "refunded",
    })
    .eq("stripe_payment_id", paymentIntentId);

  if (error) {
    console.error("Error updating refund:", error);
  }

  console.log(`💰 Refund processed for payment ${paymentIntentId}`);
}
