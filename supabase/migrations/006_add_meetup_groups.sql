-- Meetup groups table (same pattern as luma_calendars)
CREATE TABLE IF NOT EXISTS meetup_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  urlname TEXT UNIQUE NOT NULL,
  name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with known NWA groups
INSERT INTO meetup_groups (urlname, name) VALUES
  ('nwa-techfest', 'NWA TechFest'),
  ('northwest-arkansas-developers-group', 'NW Arkansas Developers Group'),
  ('producttank-bentonville', 'ProductTank Bentonville')
ON CONFLICT (urlname) DO NOTHING;
