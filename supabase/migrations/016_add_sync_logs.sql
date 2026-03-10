-- Sync health monitoring
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  trigger TEXT NOT NULL DEFAULT 'cron',
  status TEXT NOT NULL DEFAULT 'success',
  synced INTEGER DEFAULT 0,
  skipped INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_source ON sync_logs(source);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(created_at);
