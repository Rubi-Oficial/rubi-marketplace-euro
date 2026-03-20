import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const COMMISSION_RATE = 0.15;

Deno.serve(async (req) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    console.error("[stripe-webhook] STRIPE_SECRET_KEY not configured");
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-04-30.basil" });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret || !sig) {
      console.error("[stripe-webhook] Missing STRIPE_WEBHOOK_SECRET or stripe-signature header");
      return new Response("Webhook signature required", { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return new Response("Webhook Error", { status: 400 });
  }

  console.log(`[stripe-webhook] Processing event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;

        console.log(`[stripe-webhook] checkout.session.completed — user=${userId}, plan=${planId}, session=${session.id}`);

        if (!userId || !planId) {
          console.warn("[stripe-webhook] Missing user_id or plan_id in session metadata, skipping");
          break;
        }

        // Update subscription record
        const { data: sub, error: subError } = await supabase
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

        if (subError) {
          console.error(`[stripe-webhook] Failed to update subscription for session ${session.id}:`, subError.message);
          break;
        }

        console.log(`[stripe-webhook] Subscription ${sub.id} activated for user ${userId}`);

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
            // Block self-referral
            if (userData.referred_by_user_id === userId) {
              console.warn(`[stripe-webhook] Self-referral blocked for user ${userId}`);
              break;
            }

            // Check no existing conversion for this user (first payment only)
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

              const commissionAmount = Math.round(plan.price * COMMISSION_RATE * 100) / 100;

              console.log(`[stripe-webhook] Creating commission: referrer=${userData.referred_by_user_id}, amount=${commissionAmount}`);

              const { error: insertErr } = await supabase
                .from("referral_conversions")
                .insert({
                  referrer_user_id: userData.referred_by_user_id,
                  referred_user_id: userId,
                  referral_code: referrer?.referral_code ?? "",
                  conversion_type: "subscription",
                  subscription_id: sub.id,
                  commission_rate: COMMISSION_RATE,
                  commission_amount: commissionAmount,
                  status: "pending",
                });

              if (insertErr) {
                console.warn(`[stripe-webhook] Commission insert skipped (likely duplicate): ${insertErr.message}`);
              } else {
                console.log(`[stripe-webhook] Commission created successfully`);
              }
            } else {
              console.log(`[stripe-webhook] Commission already exists for referred user ${userId}, skipping`);
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

        console.log(`[stripe-webhook] subscription.updated — stripe_sub=${stripeSubId}, new_status=${status}`);

        const { error: updateErr } = await supabase
          .from("subscriptions")
          .update({
            status,
            expires_at: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          })
          .eq("stripe_subscription_id", stripeSubId);

        if (updateErr) {
          console.error(`[stripe-webhook] Failed to update subscription ${stripeSubId}:`, updateErr.message);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[stripe-webhook] subscription.deleted — stripe_sub=${subscription.id}`);

        const { error: delErr } = await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);

        if (delErr) {
          console.error(`[stripe-webhook] Failed to cancel subscription ${subscription.id}:`, delErr.message);
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`[stripe-webhook] Processing error for event ${event.id}:`, err);
    return new Response("Internal error", { status: 500 });
  }
});
