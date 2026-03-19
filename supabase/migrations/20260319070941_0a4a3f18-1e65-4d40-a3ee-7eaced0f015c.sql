-- Update existing profiles with valid city_slugs and data
UPDATE profiles SET 
  city = 'Amsterdam', city_slug = 'amsterdam', 
  category = 'Premium', age = 24, pricing_from = 200,
  bio = 'Professional companion available in Amsterdam. Fluent in English and Dutch.',
  languages = ARRAY['English', 'Dutch'],
  slug = 'diego-amsterdam',
  whatsapp = '+31612345678',
  display_name = 'Sofia Laurent'
WHERE id = '0c2161da-cff5-4089-9223-603cffb5eaaa';

UPDATE profiles SET 
  city = 'Barcelona', city_slug = 'barcelona',
  category = 'Elite', age = 27, pricing_from = 300,
  bio = 'Elegant companion for dinner dates and events in Barcelona.',
  languages = ARRAY['English', 'Spanish', 'Portuguese'],
  slug = 'diego-barcelona',
  whatsapp = '+34612345678',
  display_name = 'Isabella Reyes'
WHERE id = '444cb3b7-334a-4264-a53c-d6c95c16630e';

UPDATE profiles SET 
  city = 'Den Haag', city_slug = 'den-haag',
  category = 'Premium', age = 23, pricing_from = 250,
  bio = 'Charming and sophisticated. Available for social events and travel.',
  languages = ARRAY['English', 'French'],
  slug = 'nina-denhaag',
  whatsapp = '+31698765432',
  display_name = 'Nina Dubois'
WHERE id = '9e1c3eb4-1609-4828-a98f-a4b0c71d0049';

-- Activate subscription
UPDATE subscriptions SET 
  status = 'active', 
  starts_at = now(), 
  expires_at = now() + interval '30 days'
WHERE id = '4302ee45-51ff-4ba1-b968-d83039646463';

-- Create subscription for second user too
INSERT INTO subscriptions (user_id, plan_id, status, starts_at, expires_at)
VALUES (
  '6809d822-3091-4b77-a72f-d14fe3748412',
  '43acbea7-8c0c-401d-9b90-47dabfa099b5',
  'active',
  now(),
  now() + interval '30 days'
);

-- Link services to profiles
INSERT INTO profile_services (profile_id, service_id) VALUES
  ('0c2161da-cff5-4089-9223-603cffb5eaaa', '19301972-b3cb-4f2a-b220-d9474a67d044'),
  ('0c2161da-cff5-4089-9223-603cffb5eaaa', '6fcd525b-25ce-4824-9a82-0c6c458a3332'),
  ('444cb3b7-334a-4264-a53c-d6c95c16630e', '19301972-b3cb-4f2a-b220-d9474a67d044'),
  ('444cb3b7-334a-4264-a53c-d6c95c16630e', 'f956a8cc-8625-4dbe-8199-43f30d69c10a'),
  ('444cb3b7-334a-4264-a53c-d6c95c16630e', '66c81239-49a3-4993-80a5-54d57ed46270'),
  ('9e1c3eb4-1609-4828-a98f-a4b0c71d0049', '48848fb5-d653-498d-8431-84bca26abf64'),
  ('9e1c3eb4-1609-4828-a98f-a4b0c71d0049', 'd410e3cb-6de6-43b8-9db5-7161927fffaf'),
  ('9e1c3eb4-1609-4828-a98f-a4b0c71d0049', 'c7788e68-cfae-44c3-af7b-ae99c805e4ba')
ON CONFLICT DO NOTHING;