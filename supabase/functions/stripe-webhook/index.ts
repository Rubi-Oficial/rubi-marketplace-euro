import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const COMMISSION_RATE = 0.15;

Deno.serve(async (req) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-04-30.basil" });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook Error", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;

        if (!userId || !planId) break;

        // Update subscription record
        const { data: sub } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            starts_at: new Date().toISOString(),
          })
          .eq("stripe_checkout_session_id", session.id)
          .select("id, plan_id")
          .single();

        // Affiliate commission logic
        if (sub) {
          const { data: plan } = await supabase
            .from("plans")
            .select("price")
            .eq("id", sub.plan_id)
            .single();

          const { data: userData } = await supabase
            .from("users")
            .select("referred_by_user_id")
            .eq("id", userId)
            .single();

          if (userData?.referred_by_user_id && plan) {
            // PHASE 3: Block self-referral
            if (userData.referred_by_user_id === userId) {
              console.warn(`Self-referral blocked for user ${userId}`);
              break;
            }

            // Check no existing conversion for this user (first payment only)
            // DB constraint unique_first_conversion_per_user also enforces this
            const { count } = await supabase
              .from("referral_conversions")
              .select("id", { count: "exact", head: true })
              .eq("referred_user_id", userId)
              .eq("conversion_type", "subscription");

            if ((count ?? 0) === 0) {
              const { data: referrer } = await supabase
                .from("users")
                .select("referral_code")
                .eq("id", userData.referred_by_user_id)
                .single();

              const { error: insertErr } = await supabase
                .from("referral_conversions")
                .insert({
                  referrer_user_id: userData.referred_by_user_id,
                  referred_user_id: userId,
                  referral_code: referrer?.referral_code ?? "",
                  conversion_type: "subscription",
                  subscription_id: sub.id,
                  commission_rate: COMMISSION_RATE,
                  commission_amount:
                    Math.round(plan.price * COMMISSION_RATE * 100) / 100,
                  status: "pending",
                });

              if (insertErr) {
                // Unique constraint violation = duplicate, safe to ignore
                console.warn("Commission insert skipped:", insertErr.message);
              }
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubId = subscription.id;

        let status: string;
        switch (subscription.status) {
          case "active":
            status = "active";
            break;
          case "past_due":
            status = "past_due";
            break;
          case "canceled":
            status = "canceled";
            break;
          case "unpaid":
            status = "expired";
            break;
          default:
            status = subscription.status;
        }

        await supabase
          .from("subscriptions")
          .update({
            status,
            expires_at: subscription.current_period_end
              ? new Date(
                  subscription.current_period_end * 1000
                ).toISOString()
              : null,
          })
          .eq("stripe_subscription_id", stripeSubId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
