import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { createCustomerPortal } from "@/libs/stripe";
import { createClient } from "@/libs/supabase";

export async function POST(req) {
  const session = await auth();

  if (session) {
    try {
      const body = await req.json();
      const { id } = session.user;

      // Get user's Stripe customer ID from organizations table
      const supabase = createClient();
      const { data: org } = await supabase
        .from("organizations")
        .select("stripe_customer_id")
        .eq("user_id", id)
        .single();

      if (!org?.stripe_customer_id) {
        return NextResponse.json(
          {
            error:
              "You don't have a billing account yet. Make a purchase first.",
          },
          { status: 400 }
        );
      } else if (!body.returnUrl) {
        console.log("Missing returnUrl in body:", body);
        return NextResponse.json(
          { error: "Return URL is required" },
          { status: 400 }
        );
      }

      const stripePortalUrl = await createCustomerPortal({
        customerId: org.stripe_customer_id,
        returnUrl: (() => { console.log("Using Return URL:", body.returnUrl); return body.returnUrl; })(),
      });

      return NextResponse.json({
        url: stripePortalUrl,
      });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: e?.message }, { status: 500 });
    }
  } else {
    // Not Signed in
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
}
