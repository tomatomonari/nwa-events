-- Create eventbrite_orgs table for org-based sync (replaces city-based search)
CREATE TABLE IF NOT EXISTS eventbrite_orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id TEXT UNIQUE NOT NULL,
  name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Remove fun events — NWA Events is business-only now
DELETE FROM events WHERE primary_category = 'fun';
