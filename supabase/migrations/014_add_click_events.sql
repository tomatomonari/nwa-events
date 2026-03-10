-- Click tracking for event views and register clicks
CREATE TABLE click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  click_type TEXT NOT NULL CHECK (click_type IN ('view', 'register')),
  session_id TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_click_events_event_id ON click_events(event_id);
CREATE INDEX idx_click_events_created_at ON click_events(created_at);
CREATE INDEX idx_click_events_type ON click_events(click_type);

-- Allow anonymous inserts (public tracking), service role full access
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public inserts" ON click_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role full access" ON click_events FOR ALL USING (auth.role() = 'service_role');
