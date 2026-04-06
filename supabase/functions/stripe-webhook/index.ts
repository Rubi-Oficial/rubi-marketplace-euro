import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const COMMISSION_RATE = 0.15;

function stripeSubscriptionToStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "expired";
    default:
      return status;
  }
}

Deno.serve(async (req) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    console.error("[stripe-webhook] STRIPE_SECRET_KEY not configured");
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

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

  const { error: dedupError } = await supabase
    .from("stripe_webhook_event_dedup")
    .insert({ event_id: event.id, event_type: event.type });

  if (dedupError) {
    if (dedupError.code === "23505") {
      console.warn(`[stripe-webhook] replay_ignored event_id=${event.id} event_type=${event.type}`);
      return new Response(JSON.stringify({ received: true, replay: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error(
      `[stripe-webhook] Failed to validate deduplication for event ${event.id}: ${dedupError.message}`,
    );
    return new Response("Internal error", { status: 500 });
  }

  console.log(`[stripe-webhook] new_event event_id=${event.id} event_type=${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId        = session.metadata?.user_id;
        const planId        = session.metadata?.plan_id;
        const highlightType = session.metadata?.highlight_type; // "plan" | "boost" | undefined

        console.log(`[stripe-webhook] checkout.session.completed — user=${userId}, plan=${planId}, highlight_type=${highlightType}, session=${session.id}`);

        if (!userId || !planId) {
          console.warn("[stripe-webhook] Missing user_id or plan_id in session metadata, skipping");
          break;
        }

        // Fetch plan details for highlight handling
        const { data: planData } = await supabase
          .from("plans")
          .select("tier, is_boost, highlight_days, price")
          .eq("id", planId)
          .maybeSingle();

        // ── Boost: one-time payment ──────────────────────────────────────────
        if (highlightType === "boost" || planData?.is_boost === true) {
          const { data: profileRow } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          if (profileRow?.id) {
            const { error: boostErr } = await supabase.rpc("apply_boost", {
              p_profile_id: profileRow.id,
              p_source:     event.id,
            });
            if (boostErr) {
              console.error(`[stripe-webhook] apply_boost failed for profile ${profileRow.id}:`, boostErr.message);
            } else {
              console.log(`[stripe-webhook] Boost applied for profile ${profileRow.id}`);
            }
          } else {
            console.warn(`[stripe-webhook] No profile found for user ${userId}, skipping boost`);
          }
          break; // Do not proceed to subscription handling
        }

        // ── Regular subscription plan ────────────────────────────────────────

        // Fetch subscription details from Stripe to get expires_at immediately
        let expiresAt: string | null = null;
        if (session.subscription) {
          try {
            const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string);
            if (stripeSub.current_period_end) {
              expiresAt = new Date(stripeSub.current_period_end * 1000).toISOString();
            }
          } catch (subFetchErr) {
            console.warn(`[stripe-webhook] Could not fetch subscription period end:`, subFetchErr);
          }
        }

        // Update subscription record
        const { data: sub, error: subError } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            starts_at: new Date().toISOString(),
            expires_at: expiresAt,
          })
          .eq("stripe_checkout_session_id", session.id)
          .select("id, plan_id")
          .single();

        if (subError) {
          console.error(`[stripe-webhook] Failed to update subscription for session ${session.id}:`, subError.message);
          break;
        }

        console.log(`[stripe-webhook] Subscription ${sub.id} activated for user ${userId}`);

        // ── Highlight tier activation (premium / exclusive plans) ────────────
        if (planData && planData.tier && planData.tier !== "standard") {
          const { data: profileRow } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          if (profileRow?.id) {
            const { error: hlErr } = await supabase.rpc("activate_or_renew_highlight", {
              p_profile_id: profileRow.id,
              p_tier:       planData.tier,
              p_days:       planData.highlight_days ?? 30,
              p_source:     event.id,
            });
            if (hlErr) {
              console.error(`[stripe-webhook] activate_or_renew_highlight failed for profile ${profileRow.id}:`, hlErr.message);
            } else {
              console.log(`[stripe-webhook] Highlight activated: tier=${planData.tier} for profile ${profileRow.id}`);
            }
          }
        }

        // Affiliate commission logic
        if (sub) {
          // planData already contains price; fallback to re-fetch if planData is missing or price is null
          let commissionPlan: { price: number } | null =
            planData?.price != null ? { price: planData.price } : null;

          if (!commissionPlan) {
            const { data: fetchedPlan } = await supabase
              .from("plans")
              .select("price")
              .eq("id", sub.plan_id)
              .single();
            commissionPlan = fetchedPlan;
          }

          const { data: userData } = await supabase
            .from("users")
            .select("referred_by_user_id")
            .eq("id", userId)
            .single();

          if (userData?.referred_by_user_id && commissionPlan) {
            // Block self-referral
            if (userData.referred_by_user_id === userId) {
              console.warn(`[stripe-webhook] Self-referral blocked for user ${userId}`);
              break;
            }

            const { data: referrer } = await supabase
              .from("users")
              .select("referral_code")
              .eq("id", userData.referred_by_user_id)
              .single();

            const commissionAmount = Math.round(commissionPlan.price * COMMISSION_RATE * 100) / 100;

            console.log(`[stripe-webhook] Creating commission: referrer=${userData.referred_by_user_id}, amount=${commissionAmount}`);

            const { data: conversionRows, error: conversionError } = await supabase
              .from("referral_conversions")
              .upsert(
                {
                  referrer_user_id: userData.referred_by_user_id,
                  referred_user_id: userId,
                  referral_code: referrer?.referral_code ?? "",
                  conversion_type: "subscription",
                  subscription_id: sub.id,
                  commission_rate: COMMISSION_RATE,
                  commission_amount: commissionAmount,
                  status: "pending",
                },
                {
                  onConflict: "referred_user_id,conversion_type",
                  ignoreDuplicates: true,
                },
              )
              .select("id");

            if (conversionError) {
              console.error(`[stripe-webhook] Failed to upsert commission for user ${userId}: ${conversionError.message}`);
            } else if ((conversionRows?.length ?? 0) === 0) {
              console.warn(
                `[stripe-webhook] idempotency_conflict conversion_exists referred_user_id=${userId} conversion_type=subscription`,
              );
            } else {
              console.log(`[stripe-webhook] Commission created successfully`);
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubId = subscription.id;

        const status = stripeSubscriptionToStatus(subscription.status);

        console.log(`[stripe-webhook] subscription.updated — stripe_sub=${stripeSubId}, new_status=${status}`);

        const { data: updatedSubs, error: updateErr } = await supabase
          .from("subscriptions")
          .update({
            status,
            expires_at: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          })
          .eq("stripe_subscription_id", stripeSubId)
          .select("id, user_id, plan_id");

        if (updateErr) {
          console.error(`[stripe-webhook] Failed to update subscription ${stripeSubId}:`, updateErr.message);
          break;
        }

        const updatedSub = updatedSubs?.[0];
        if (!updatedSub) break;

        const { data: planData } = await supabase
          .from("plans")
          .select("tier, is_boost, highlight_days")
          .eq("id", updatedSub.plan_id)
          .maybeSingle();

        if (!planData || planData.is_boost || !planData.tier || planData.tier === "standard") {
          break;
        }

        const { data: profileRow } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", updatedSub.user_id)
          .maybeSingle();

        if (!profileRow?.id) break;

        const eventSource = `${event.id}:sub:${stripeSubId}`;

        if (status === "active" || status === "past_due") {
          const { error: hlErr } = await supabase.rpc("activate_or_renew_highlight", {
            p_profile_id: profileRow.id,
            p_tier: planData.tier,
            p_days: planData.highlight_days ?? 30,
            p_source: eventSource,
          });

          if (hlErr) {
            console.error(`[stripe-webhook] Renewal sync failed for profile ${profileRow.id}:`, hlErr.message);
          }
        } else {
          const { error: expErr } = await supabase.rpc("expire_highlight", {
            p_profile_id: profileRow.id,
            p_source: eventSource,
          });

          if (expErr) {
            console.error(`[stripe-webhook] Expire highlight failed for profile ${profileRow.id}:`, expErr.message);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[stripe-webhook] subscription.deleted — stripe_sub=${subscription.id}`);

        const { data: canceledSubs, error: delErr } = await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id)
          .select("user_id");

        if (delErr) {
          console.error(`[stripe-webhook] Failed to cancel subscription ${subscription.id}:`, delErr.message);
          break;
        }

        const canceledSub = canceledSubs?.[0];
        if (!canceledSub) break;

        const { data: profileRow } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", canceledSub.user_id)
          .maybeSingle();

        if (!profileRow?.id) break;

        const { error: expErr } = await supabase.rpc("expire_highlight", {
          p_profile_id: profileRow.id,
          p_source: `${event.id}:deleted:${subscription.id}`,
        });

        if (expErr) {
          console.error(`[stripe-webhook] Expire highlight failed for profile ${profileRow.id}:`, expErr.message);
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
