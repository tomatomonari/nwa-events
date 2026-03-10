-- Email event tracking from Resend webhooks
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_email_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_events_type ON email_events(event_type);
CREATE INDEX idx_email_events_created_at ON email_events(created_at);
CREATE INDEX idx_email_events_resend_id ON email_events(resend_email_id);
