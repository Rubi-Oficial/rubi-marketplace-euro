
-- Drop function with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS public.has_role(uuid, public.user_role) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop old tables
DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Create enums
CREATE TYPE public.app_role AS ENUM ('client', 'professional', 'admin');
CREATE TYPE public.profile_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'paused');
CREATE TYPE public.moderation_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.billing_period AS ENUM ('monthly', 'quarterly');
CREATE TYPE public.subscription_status AS ENUM ('pending', 'active', 'past_due', 'canceled', 'expired');
CREATE TYPE public.referral_conversion_status AS ENUM ('pending', 'approved', 'paid', 'rejected');

-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'client',
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  google_auth_enabled BOOLEAN NOT NULL DEFAULT false,
  referral_code TEXT UNIQUE,
  referral_link TEXT,
  referred_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles table (professional profiles)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE,
  display_name TEXT,
  city TEXT,
  country TEXT,
  category TEXT,
  bio TEXT,
  languages TEXT[],
  age INTEGER,
  pricing_from NUMERIC,
  whatsapp TEXT,
  telegram TEXT,
  status public.profile_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  featured_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profile images
CREATE TABLE public.profile_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  moderation_status public.moderation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plans
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  billing_period public.billing_period NOT NULL DEFAULT 'monthly',
  features_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_checkout_session_id TEXT,
  status public.subscription_status NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Referral clicks
CREATE TABLE public.referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  visitor_id TEXT,
  landing_page TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Referral conversions
CREATE TABLE public.referral_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  conversion_type TEXT NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id),
  commission_rate NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  status public.referral_conversion_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin actions
CREATE TABLE public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_slug ON public.profiles(slug);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_city ON public.profiles(city);
CREATE INDEX idx_profile_images_profile_id ON public.profile_images(profile_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_referral_clicks_referrer ON public.referral_clicks(referrer_user_id);
CREATE INDEX idx_referral_conversions_referrer ON public.referral_conversions(referrer_user_id);
CREATE INDEX idx_leads_profile_id ON public.leads(profile_id);
CREATE INDEX idx_admin_actions_admin ON public.admin_actions(admin_user_id);

-- Functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = 'public'
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.referral_conversions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer: check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.users WHERE id = _user_id AND role = _role) $$;

-- Security definer: get role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$ SELECT role FROM public.users WHERE id = _user_id $$;

-- Auth trigger: create user row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  _referrer_id UUID;
  _role public.app_role;
  _code TEXT;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'client');
  _code := substr(md5(random()::text), 1, 8);

  IF NEW.raw_user_meta_data ->> 'referral_code' IS NOT NULL THEN
    SELECT id INTO _referrer_id FROM public.users
    WHERE referral_code = NEW.raw_user_meta_data ->> 'referral_code';
  END IF;

  INSERT INTO public.users (id, role, full_name, email, referral_code, referral_link, referred_by_user_id, google_auth_enabled)
  VALUES (
    NEW.id, _role,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, ''),
    _code, '/cadastro?ref=' || _code,
    _referrer_id,
    (NEW.raw_app_meta_data ->> 'provider') = 'google'
  );

  IF _role = 'professional' THEN
    INSERT INTO public.profiles (user_id, display_name, status)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), 'draft');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own record" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can read all users" ON public.users FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own record" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "System can insert users" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS: Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved profiles are public" ON public.profiles FOR SELECT USING (status = 'approved');
CREATE POLICY "Owners can read own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Profile Images
ALTER TABLE public.profile_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved images are public" ON public.profile_images FOR SELECT USING (moderation_status = 'approved');
CREATE POLICY "Owners can manage own images" ON public.profile_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = profile_images.profile_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Admins can manage all images" ON public.profile_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active plans are public" ON public.plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plans" ON public.plans FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can read all subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Referral clicks
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Referrers can read own clicks" ON public.referral_clicks FOR SELECT TO authenticated USING (referrer_user_id = auth.uid());
CREATE POLICY "Anyone can insert clicks" ON public.referral_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read all clicks" ON public.referral_clicks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Referral conversions
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Referrers can read own conversions" ON public.referral_conversions FOR SELECT TO authenticated USING (referrer_user_id = auth.uid());
CREATE POLICY "Admins can manage conversions" ON public.referral_conversions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profile owners can read own leads" ON public.leads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = leads.profile_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Anyone can insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read all leads" ON public.leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Admin actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage admin_actions" ON public.admin_actions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
