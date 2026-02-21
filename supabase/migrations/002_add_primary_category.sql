-- Add primary_category column for Business vs Fun filtering
ALTER TABLE events
  ADD COLUMN primary_category TEXT NOT NULL DEFAULT 'fun'
  CONSTRAINT chk_primary_category CHECK (primary_category IN ('business', 'fun'));

-- Backfill: All Luma events are business (curated business orgs)
UPDATE events SET primary_category = 'business' WHERE source_platform = 'luma';

-- Backfill: Eventbrite events with business-ish categories
UPDATE events SET primary_category = 'business'
WHERE source_platform = 'eventbrite'
  AND (
    categories && ARRAY['networking', 'tech', 'startup', 'career', 'education']
  );

-- Index for filtering
CREATE INDEX idx_events_primary_category ON events (primary_category);
