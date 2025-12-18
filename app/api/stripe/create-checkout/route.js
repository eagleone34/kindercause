import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createCheckout } from "@/libs/stripe";
import fs from "fs";
import path from "path";

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

// This function is used to create a Stripe Checkout Session (one-time payment or subscription)
// It's called by the <ButtonCheckout /> component
// By default, it doesn't force users to be authenticated. But if they are, it will prefill the Checkout data with their email and/or credit card
export async function POST(req) {
  const body = await req.json();

  if (!body.priceId) {
    return NextResponse.json(
      { error: "Price ID is required" },
      { status: 400 }
    );
  } else if (!body.successUrl || !body.cancelUrl) {
    return NextResponse.json(
      { error: "Success and cancel URLs are required" },
      { status: 400 }
    );
  } else if (!body.mode) {
    return NextResponse.json(
      {
        error:
          "Mode is required (either 'payment' for one-time payments or 'subscription' for recurring subscription)",
      },
      { status: 400 }
    );
  }

  try {
    const session = await auth();

    // DEBUG LOGGING
    const key = process.env.STRIPE_SECRET_KEY;
    const masked = key ? key.slice(0, 10) + "..." : "MISSING";
    logToFile(`DEBUG: create-checkout Key: ${masked}`);
    console.log(`DEBUG: create-checkout Key: ${masked}`);

    const { priceId, mode, successUrl, cancelUrl } = body;

    const stripeSessionURL = await createCheckout({
      priceId,
      mode,
      successUrl,
      cancelUrl,
      // If user is logged in, it will pass the user ID to the Stripe Session so it can be retrieved in the webhook later
      clientReferenceId: session?.user?.id,
      // If user is logged in, this will automatically prefill Checkout data like email
      user: session?.user,
    });

    return NextResponse.json({ url: stripeSessionURL });
  } catch (e) {
    console.error(e);
    logToFile(`ERROR in create-checkout: ${e.message}`);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
