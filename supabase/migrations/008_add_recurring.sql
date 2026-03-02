-- Add recurring column to events
ALTER TABLE events ADD COLUMN recurring BOOLEAN DEFAULT false;

-- Backfill: mark events as recurring where 2+ events share (title, organizer_name)
UPDATE events SET recurring = true
WHERE (title, organizer_name) IN (
  SELECT title, organizer_name FROM events
  GROUP BY title, organizer_name HAVING COUNT(*) >= 2
);
