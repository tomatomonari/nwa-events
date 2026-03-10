-- Soft-delete subscribers instead of hard deleting
ALTER TABLE subscribers ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed'));
