-- Luma calendars table: DB-backed list of calendars to sync
CREATE TABLE IF NOT EXISTS luma_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with current calendars
INSERT INTO luma_calendars (slug, name) VALUES
  ('onwardfx', 'Onward FX'),
  ('StartupJunkie', 'Startup Junkie'),
  ('arkaderetail', 'Arkade Retail')
ON CONFLICT (slug) DO NOTHING;
