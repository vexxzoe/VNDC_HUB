-- Document update tasks
CREATE TABLE IF NOT EXISTS update_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(500) NOT NULL,
  file_name   VARCHAR(500),
  department  VARCHAR(100) NOT NULL DEFAULT 'Chung',
  audience    TEXT[] NOT NULL DEFAULT ARRAY['all'],
  status      VARCHAR(50) NOT NULL DEFAULT 'pending'
                CHECK (status IN (
                  'pending','reviewing','approved',
                  'ai_trained','notified'
                )),
  progress    INTEGER NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_logs (
  id          SERIAL PRIMARY KEY,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_name TEXT,
  user_id     UUID REFERENCES users(id),
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  icon       VARCHAR(50),
  link       VARCHAR(255),
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status     ON update_tasks(status);
CREATE INDEX IF NOT EXISTS idx_activity_user    ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_user       ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read       ON notifications(user_id, is_read);
