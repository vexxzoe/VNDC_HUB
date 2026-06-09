-- Quiz questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id   UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  options     TEXT[] NOT NULL,
  answer      INTEGER NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id    UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  answers      JSONB NOT NULL DEFAULT '{}',
  passed       BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  score     INTEGER NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_module ON quiz_questions(module_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user    ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user     ON certificates(user_id);
