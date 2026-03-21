import Stripe from "npm:stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("[create-checkout] STRIPE_SECRET_KEY not configured");
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.warn("[create-checkout] Missing Authorization header");
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.warn(`[create-checkout] Auth failed: ${authError?.message || "no user"}`);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan_id } = await req.json();
    if (!plan_id) {
      return new Response(JSON.stringify({ error: "plan_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[create-checkout] user=${user.id}, plan=${plan_id}`);

    // Check for existing active or pending subscription
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["active", "pending"])
      .limit(1)
      .maybeSingle();

    if (existingSub?.status === "active") {
      console.log(`[create-checkout] User ${user.id} already has active subscription, blocking`);
      return new Response(
        JSON.stringify({ error: "Você já possui uma assinatura ativa." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch plan
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      console.warn(`[create-checkout] Plan not found: ${plan_id}`);
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate email before sending to Stripe
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!user.email || !emailRegex.test(user.email)) {
      console.warn(`[create-checkout] Invalid email: ${user.email}`);
      return new Response(
        JSON.stringify({ error: "Email inválido. Use um email real para assinar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-04-30.basil" });

    // Reuse existing Stripe customer if available
    let customerId: string | undefined;
    try {
      const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    } catch (stripeErr) {
      console.warn(`[create-checkout] Stripe customer lookup failed:`, stripeErr);
    }

    // Determine Stripe interval
    const interval = "month";
    const intervalCount = plan.billing_period === "quarterly" ? 3 : 1;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      metadata: {
        user_id: user.id,
        plan_id: plan.id,
      },
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `AURA - ${plan.name} Plan`,
              description: `${plan.billing_period === "quarterly" ? "Quarterly" : "Monthly"} subscription`,
            },
            unit_amount: Math.round(plan.price * 100),
            recurring: { interval, interval_count: intervalCount },
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get("origin")}/app/plano?status=success`,
      cancel_url: `${req.headers.get("origin")}/app/plano?status=canceled`,
    });

    console.log(`[create-checkout] Session created: ${session.id}`);

    // Upsert subscription record
    if (existingSub?.status === "pending") {
      const { error: upErr } = await supabase
        .from("subscriptions")
        .update({
          plan_id: plan.id,
          stripe_checkout_session_id: session.id,
        })
        .eq("id", existingSub.id);

      if (upErr) {
        console.error(`[create-checkout] Failed to update pending sub ${existingSub.id}:`, upErr.message);
      }
    } else {
      const { error: insErr } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        plan_id: plan.id,
        stripe_checkout_session_id: session.id,
        status: "pending",
      });

      if (insErr) {
        console.error(`[create-checkout] Failed to insert subscription:`, insErr.message);
      }
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[create-checkout] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
