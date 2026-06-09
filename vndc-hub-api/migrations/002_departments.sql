-- Department permissions
CREATE TABLE IF NOT EXISTS department_permissions (
  id          SERIAL PRIMARY KEY,
  department  VARCHAR(100) UNIQUE NOT NULL,
  library     BOOLEAN NOT NULL DEFAULT true,
  videos      BOOLEAN NOT NULL DEFAULT true,
  forms       BOOLEAN NOT NULL DEFAULT true,
  updates     BOOLEAN NOT NULL DEFAULT false,
  analytics   BOOLEAN NOT NULL DEFAULT false,
  people      BOOLEAN NOT NULL DEFAULT false,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES users(id)
);

-- Permission change log
CREATE TABLE IF NOT EXISTS permission_logs (
  id          SERIAL PRIMARY KEY,
  department  VARCHAR(100) NOT NULL,
  permission  VARCHAR(100) NOT NULL,
  old_value   BOOLEAN,
  new_value   BOOLEAN NOT NULL,
  changed_by  UUID REFERENCES users(id),
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
