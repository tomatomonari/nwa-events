-- HogSync organizations table (same pattern as luma_calendars, meetup_groups)
CREATE TABLE IF NOT EXISTS hogsync_orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT UNIQUE NOT NULL,
  name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with OEI
INSERT INTO hogsync_orgs (group_id, name) VALUES
  ('35807', 'Office of Entrepreneurship and Innovation')
ON CONFLICT (group_id) DO NOTHING;
