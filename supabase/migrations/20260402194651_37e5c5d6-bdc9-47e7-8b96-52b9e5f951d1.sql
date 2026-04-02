
-- Add validation triggers for contact_messages
CREATE OR REPLACE FUNCTION public.validate_contact_message()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF char_length(NEW.name) > 255 THEN
    RAISE EXCEPTION 'Name must be 255 characters or fewer';
  END IF;
  IF char_length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'Email must be 255 characters or fewer';
  END IF;
  IF char_length(NEW.message) > 2000 THEN
    RAISE EXCEPTION 'Message must be 2000 characters or fewer';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_contact_message
BEFORE INSERT ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.validate_contact_message();

-- Add validation trigger for leads.source
CREATE OR REPLACE FUNCTION public.validate_lead()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.source NOT IN ('profile_view', 'whatsapp_click', 'telegram_click', 'phone_click', 'website_click') THEN
    RAISE EXCEPTION 'Invalid lead source: %', NEW.source;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_lead
BEFORE INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.validate_lead();

-- Add validation trigger for referral_clicks
CREATE OR REPLACE FUNCTION public.validate_referral_click()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.user_agent IS NOT NULL AND char_length(NEW.user_agent) > 512 THEN
    NEW.user_agent := left(NEW.user_agent, 512);
  END IF;
  IF NEW.landing_page IS NOT NULL AND char_length(NEW.landing_page) > 2048 THEN
    NEW.landing_page := left(NEW.landing_page, 2048);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_referral_click
BEFORE INSERT ON public.referral_clicks
FOR EACH ROW EXECUTE FUNCTION public.validate_referral_click();
