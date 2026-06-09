-- Learning modules
CREATE TABLE IF NOT EXISTS modules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            VARCHAR(255) NOT NULL,
  level            VARCHAR(50) NOT NULL
                     CHECK (level IN ('Cơ bản','Trung cấp','Nâng cao','Chuyên gia')),
  department       TEXT[] NOT NULL DEFAULT ARRAY['all'],
  lessons          INTEGER NOT NULL DEFAULT 0,
  videos           INTEGER NOT NULL DEFAULT 0,
  estimated_hours  NUMERIC(4,1) NOT NULL DEFAULT 0,
  icon             VARCHAR(50),
  locked           BOOLEAN NOT NULL DEFAULT false,
  order_index      INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User learning progress
CREATE TABLE IF NOT EXISTS learning_progress (
  id           SERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id    UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  progress     INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  quiz_score   INTEGER CHECK (quiz_score BETWEEN 0 AND 100),
  completed_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, module_id)
);

-- Video watched tracking
CREATE TABLE IF NOT EXISTS video_watched (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id   VARCHAR(50) NOT NULL,
  watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user   ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_module ON learning_progress(module_id);
