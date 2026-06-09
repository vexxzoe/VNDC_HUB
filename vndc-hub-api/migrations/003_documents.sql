-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(500) NOT NULL,
  type        VARCHAR(50)  NOT NULL
                CHECK (type IN ('PDF','Excel','Video','Module')),
  department  VARCHAR(100) NOT NULL,
  audience    TEXT[]       NOT NULL DEFAULT ARRAY['all'],
  version     VARCHAR(20)  NOT NULL DEFAULT 'v1.0',
  tag         VARCHAR(100),
  size        VARCHAR(50),
  file_path   VARCHAR(500),
  file_url    VARCHAR(500),
  views       INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document versions history
CREATE TABLE IF NOT EXISTS document_versions (
  id          SERIAL PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version     VARCHAR(20) NOT NULL,
  file_path   VARCHAR(500),
  note        TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, document_id)
);

-- Document views tracking
CREATE TABLE IF NOT EXISTS document_views (
  id          SERIAL PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id),
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_dept   ON documents(department);
CREATE INDEX IF NOT EXISTS idx_documents_type   ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_active ON documents(is_active);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user   ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_views_doc    ON document_views(document_id);
