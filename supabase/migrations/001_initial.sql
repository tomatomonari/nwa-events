-- Core events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location_name TEXT,
  location_address TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  online_url TEXT,
  categories TEXT[] DEFAULT '{}',
  image_url TEXT,
  source_url TEXT,
  source_platform TEXT,
  source_id TEXT,
  organizer_name TEXT NOT NULL,
  organizer_title TEXT,
  organizer_company TEXT,
  organizer_avatar_url TEXT,
  status TEXT DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_status ON events(status);
CREATE UNIQUE INDEX idx_events_source ON events(source_platform, source_id) WHERE source_id IS NOT NULL;

-- Newsletter subscribers
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Public read access for approved events
CREATE POLICY "Public can view approved events"
  ON events FOR SELECT
  USING (status = 'approved');

-- Service role can do everything
CREATE POLICY "Service role full access events"
  ON events FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access subscribers"
  ON subscribers FOR ALL
  USING (true)
  WITH CHECK (true);
