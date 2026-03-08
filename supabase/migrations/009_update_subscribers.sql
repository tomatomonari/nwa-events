-- Add subscription preferences and verification columns to subscribers table
ALTER TABLE subscribers ADD COLUMN cadence TEXT DEFAULT 'weekly' CHECK (cadence IN ('daily', 'weekly'));
ALTER TABLE subscribers ADD COLUMN categories TEXT[] DEFAULT '{business}';
ALTER TABLE subscribers ADD COLUMN verified BOOLEAN DEFAULT false;
ALTER TABLE subscribers ADD COLUMN verification_token TEXT UNIQUE;
ALTER TABLE subscribers ADD COLUMN manage_token TEXT UNIQUE;
ALTER TABLE subscribers ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
