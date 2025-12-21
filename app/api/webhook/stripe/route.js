import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createAdminSupabaseClient } from "@/libs/supabase";
import { sendWelcomeEmail } from "@/libs/resend";
import configFile from "@/config";
import fs from "fs";
import path from "path";

// Initialize Stripe only if the secret key is available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
if (!stripe) console.error("Stripe failed to initialize. Check STRIPE_SECRET_KEY.");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const LOG_FILE = path.join(process.cwd(), "webhook-debug.log");

function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync(LOG_FILE, logLine);
  } catch (err) {
    // console.error("Failed to write to log file:", err);
  }
}

// Stripe webhook handler for KinderCause
// Handles both subscription payments (for SaaS) and one-time payments (tickets/donations)
export async function POST(req) {
  logToFile("Received Webhook Request");

  // Check if Stripe is configured
  if (!stripe || !webhookSecret) {
    const msg = "Stripe is not configured properly. Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET";
    logToFile(msg);
    console.error(msg);
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
    const msg = `Webhook signature verification failed. ${err.message}`;
    logToFile(msg);
    console.error(msg);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const data = event.data;
  const eventType = event.type;

  logToFile(`Processing event: ${eventType} | ID: ${event.id}`);
  logToFile(`DEBUG: Webhook Key: ${process.env.STRIPE_SECRET_KEY?.slice(0, 10)}...`);
  console.log(`DEBUG: Webhook Key: ${process.env.STRIPE_SECRET_KEY?.slice(0, 10)}...`);

  const supabase = createAdminSupabaseClient();

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        const session = data.object;
        const metadata = session.metadata || {};

        // Check if this is a fundraiser purchase (ticket/donation)
        if (metadata.fundraiser_id) {
          logToFile(`Handling Fundraiser Purchase: ${metadata.fundraiser_id}`);
          await handleFundraiserPurchase(session, supabase);
        } else {
          // This is a SaaS subscription - handle user access
          logToFile("Handling Subscription Purchase");
          await handleSubscriptionPurchase(session, supabase, stripe);
        }
        break;
      }

      case "checkout.session.expired": {
        // User didn't complete the transaction
        // Could send reminder email
        logToFile("Session expired");
        break;
      }

      case "customer.subscription.updated": {
        // Subscription changed (upgrade/downgrade/cancel pending)
        logToFile("Subscription updated");
        const subscription = data.object;
        await handleSubscriptionUpdated(subscription, supabase);
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
        logToFile("Invoice payment failed");
        break;
      }

      case "charge.refunded": {
        // Handle refunds
        const charge = data.object;
        await handleRefund(charge, supabase);
        break;
      }

      default:
        logToFile(`Unhandled event type: ${eventType}`);
      // Unhandled event type
    }
  } catch (e) {
    const msg = "Stripe webhook error: " + e.message + " | EVENT TYPE: " + eventType;
    logToFile(msg);
    logToFile(e.stack); // Log stack trace
    console.error(msg);
    console.error(e.stack);
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
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
    logToFile(`Error recording purchase: ${purchaseError.message}`);
    console.error("Error recording purchase:", purchaseError);
    throw purchaseError;
  }

  // TODO: Send confirmation email with QR code (for events)
  // TODO: Send tax receipt (for donations to nonprofits)

  logToFile(`✅ Recorded ${type} purchase: $${amountTotal} for fundraiser ${fundraiserId}`);
  console.log(
    `✅ Recorded ${type} purchase: $${amountTotal} for fundraiser ${fundraiserId}`
  );
}

// Handle SaaS subscription purchases
async function handleSubscriptionPurchase(session, supabase, stripe) {
  logToFile("--> START: handleSubscriptionPurchase");

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logToFile("❌ FATAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.");
    console.error("❌ FATAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.");
    return;
  }

  const customerId = session.customer;
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name || "New User";

  logToFile(`-- Customer: ${customerEmail} (${customerId})`);
  console.log(`-- Customer: ${customerEmail} (${customerId})`);

  // Get the price ID from line items
  // Try to get from API first, fall back to session object if that fails
  let priceId = null;

  try {
    // First try to get from session object directly (if expanded or included)
    if (session.line_items?.data?.[0]?.price?.id) {
      priceId = session.line_items.data[0].price.id;
      logToFile(`-- Got Price ID from session.line_items: ${priceId}`);
    } else if (session.display_items?.[0]?.plan?.id) {
      // Older API format
      priceId = session.display_items[0].plan.id;
      logToFile(`-- Got Price ID from session.display_items: ${priceId}`);
    } else {
      // Fall back to API call
      logToFile(`-- Fetching line items from Stripe API for session: ${session.id}`);
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      priceId = lineItems.data[0]?.price?.id;
      logToFile(`-- Got Price ID from API: ${priceId}`);
    }
  } catch (lineItemError) {
    logToFile(`-- Error fetching line items: ${lineItemError.message}`);
    console.error(`-- Error fetching line items: ${lineItemError.message}`);

    // As a last resort, check if there's any subscription info in the session
    if (session.subscription) {
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        priceId = subscription.items.data[0]?.price?.id;
        logToFile(`-- Got Price ID from subscription: ${priceId}`);
      } catch (subError) {
        logToFile(`-- Error fetching subscription: ${subError.message}`);
      }
    }
  }

  logToFile(`-- Received Price ID: ${priceId}`);
  console.log(`-- Received Price ID: ${priceId}`);

  // Find the plan
  const plan = configFile.stripe.plans.find((p) => p.priceId === priceId);
  logToFile(`-- Configured Plans: ${configFile.stripe.plans.map(p => p.priceId).join(", ")}`);
  console.log(`-- Configured Plans: ${configFile.stripe.plans.map(p => p.priceId).join(", ")}`);

  // If plan not found but we have customer details, still create the user
  // (They might be on a plan not in config.js, or using a triggered test event)
  if (!plan) {
    logToFile(`⚠️ No matching plan found for priceId: ${priceId}. Will still create user if email exists.`);
    console.warn(`⚠️ No matching plan found for priceId: ${priceId}. Will still create user if email exists.`);
    // Don't return - continue to create user anyways for testing
  } else {
    logToFile(`-- Found Plan: ${plan.name}`);
    console.log(`-- Found Plan: ${plan.name}`);
  }

  let userId = session.client_reference_id;
  logToFile(`-- Client Reference ID (User ID): ${userId || "None (New/Unlinked User)"}`);
  console.log(`-- Client Reference ID (User ID): ${userId || "None (New/Unlinked User)"}`);

  // If no userId (user wasn't logged in), find or create user
  if (!userId && customerEmail) {
    logToFile("-- Attempting to Find or Create User...");
    console.log("-- Attempting to Find or Create User...");

    // 1. Attempt to create user with auto-confirmed email
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: customerEmail,
      email_confirm: true,
      user_metadata: { name: customerName },
    });

    if (newUser?.user) {
      userId = newUser.user.id;
      logToFile(`✅ Created new user for ${customerEmail}: ${userId}`);
      console.log(`✅ Created new user for ${customerEmail}: ${userId}`);
    } else {
      logToFile(`-- Create User Failed (Likely Exists): ${createError?.message}`);
      console.log(`-- Create User Failed (Likely Exists): ${createError?.message}`);
      logToFile("-- Attempting to find existing user via listUsers...");
      console.log("-- Attempting to find existing user via listUsers...");

      // 2. If creation failed, find existing user by email
      const { data, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        logToFile(`❌ Error listing users: ${listError.message}`);
        console.error(`❌ Error listing users: ${listError.message}`);
      } else {
        // Robust handling of listUsers response structure
        const users = data?.users || data || [];
        const foundUser = users.find(u => u.email === customerEmail);
        if (foundUser) {
          userId = foundUser.id;
          logToFile(`✅ Found existing user ID: ${userId}`);
          console.log(`✅ Found existing user ID: ${userId}`);
        } else {
          logToFile(`⚠️ Could not find user ${customerEmail} in listUsers even after creation failed.`);
          console.warn(`⚠️ Could not find user ${customerEmail} in listUsers even after creation failed.`);
        }
      }
    }

    // 3. Send Welcome Email via Resend (no verification code - users sign in when ready)
    if (customerEmail) {
      try {
        logToFile("-- Sending Welcome Email...");
        console.log("-- Sending Welcome Email...");
        await sendWelcomeEmail({
          to: customerEmail,
          customerName: customerName,
          planName: plan?.name || 'Starter',
        });
        logToFile(`📧 Welcome email sent to ${customerEmail}`);
        console.log(`📧 Welcome email sent to ${customerEmail}`);
      } catch (emailError) {
        logToFile(`⚠️ Error sending welcome email: ${emailError.message}`);
        console.error(`⚠️ Error sending welcome email: ${emailError.message}`);
        // Don't throw - welcome email is not critical
      }
    }
  }

  if (userId) {
    // Check if organization exists for this user
    const { data: orgs, error: orgFetchError } = await supabase
      .from("organizations")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle(); // Use maybeSingle to avoid error if 0 rows

    if (orgFetchError) {
      logToFile(`❌ Error checking organizations: ${orgFetchError.message}`);
      console.error(`❌ Error checking organizations: ${orgFetchError.message}`);
    }

    if (orgs) {
      logToFile(`-- Updating existing organization ${orgs.id}`);
      console.log(`-- Updating existing organization ${orgs.id}`);
      // Update existing organization
      const { error } = await supabase
        .from("organizations")
        .update({
          stripe_customer_id: customerId,
          subscription_status: "active",
          price_id: priceId,
          plan_name: plan?.name || 'Unknown Plan',
        })
        .eq("user_id", userId);

      if (error) {
        logToFile(`❌ Error updating organization: ${error.message}`);
        console.error("❌ Error updating organization:", error);
      }
      else {
        logToFile("✅ Organization updated.");
        console.log("✅ Organization updated.");
      }
    } else {
      logToFile("-- Creating new organization...");
      console.log("-- Creating new organization...");
      // Create NEW organization for this user
      const orgName = customerName && customerName !== "New User" ? `${customerName}'s Daycare` : "My Daycare";
      const slug = `daycare-${Math.random().toString(36).substring(2, 8)}`; // generic slug

      const { error } = await supabase.from("organizations").insert({
        user_id: userId,
        name: orgName,
        slug: slug,
        stripe_customer_id: customerId,
        subscription_status: "active",
        price_id: priceId,
        plan_name: plan?.name || 'Unknown Plan',
        is_nonprofit: false
      });

      if (error) {
        logToFile(`❌ Error creating organization: ${error.message}`);
        console.error("❌ Error creating organization:", error);
      }
      else {
        logToFile(`✅ Created new organization for user ${userId}`);
        console.log(`✅ Created new organization for user ${userId}`);
      }
    }
  }

  logToFile(`✅ Subscription activated: ${plan?.name || 'Unknown Plan'} for customer ${customerId}`);
  console.log(`✅ Subscription activated: ${plan?.name || 'Unknown Plan'} for customer ${customerId}`);
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
    logToFile(`Error updating canceled subscription: ${error.message}`);
    console.error("Error updating canceled subscription:", error);
  }

  logToFile(`❌ Subscription canceled for customer ${customerId}`);
  console.log(`❌ Subscription canceled for customer ${customerId}`);

  // Retrieve user to send email
  try {
    const { data: org } = await supabase
      .from("organizations")
      .select("user_id, name")
      .eq("stripe_customer_id", customerId)
      .single();

    if (org?.user_id) {
      const { data: user } = await supabase.auth.admin.getUserById(org.user_id);

      if (user?.user?.email) {
        const { sendEmail } = await import("@/libs/resend");
        await sendEmail({
          to: user.user.email,
          subject: "Subscription Cancelled - KinderCause",
          text: `Hi,\n\nYour subscription for ${org.name} has been cancelled. We're sorry to see you go!\n\nIf this was a mistake, you can reactivate your subscription from your dashboard settings.\n\nBest,\nThe KinderCause Team`,
          html: `<p>Hi,</p><p>Your subscription for <strong>${org.name}</strong> has been cancelled. We're sorry to see you go!</p><p>If this was a mistake, you can reactivate your subscription from your dashboard settings.</p><p>Best,<br>The KinderCause Team</p>`
        });
        logToFile(`📧 Cancellation email sent to ${user.user.email}`);
      }
    }
  } catch (err) {
    logToFile(`⚠️ Failed to send cancellation email: ${err.message}`);
    console.error(err);
  }
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
    logToFile(`Error updating invoice paid: ${error.message}`);
    console.error("Error updating invoice paid:", error);
  }
  logToFile("Invoice paid and organization updated.");
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
    logToFile(`Error updating refund: ${error.message}`);
    console.error("Error updating refund:", error);
  }

  logToFile(`💰 Refund processed for payment ${paymentIntentId}`);
  logToFile(`💰 Refund processed for payment ${paymentIntentId}`);
  console.log(`💰 Refund processed for payment ${paymentIntentId}`);
}

// Handle subscription updates (cancellations at period end, renewals, etc.)
async function handleSubscriptionUpdated(subscription, supabase) {
  const customerId = subscription.customer;
  const status = subscription.status;
  const priceId = subscription.items.data[0]?.price?.id;

  // Find plan name
  const plan = configFile.stripe.plans.find((p) => p.priceId === priceId);

  const { error } = await supabase
    .from("organizations")
    .update({
      subscription_status: status,
      price_id: priceId,
      plan_name: plan?.name || 'Unknown Plan',
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    logToFile(`Error updating subscription status: ${error.message}`);
    console.error("Error updating subscription status:", error);
  } else {
    logToFile(`✅ Subscription updated for customer ${customerId}: ${status}`);
    console.log(`✅ Subscription updated for customer ${customerId}: ${status}`);
  }
}
