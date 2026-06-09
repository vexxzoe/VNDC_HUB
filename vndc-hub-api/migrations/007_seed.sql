-- Seed departments permissions
INSERT INTO department_permissions
  (department, library, videos, forms, updates, analytics, people)
VALUES
  ('Kinh doanh', true,  true,  true,  false, false, false),
  ('CSKH',       true,  true,  true,  false, false, false),
  ('Kỹ thuật',   true,  true,  true,  true,  false, false),
  ('Nhân sự',    true,  false, true,  false, false, true),
  ('Vận hành',   true,  true,  true,  false, false, false),
  ('Quản trị',   true,  true,  true,  true,  true,  true)
ON CONFLICT (department) DO NOTHING;

-- Seed modules
INSERT INTO modules
  (title, level, department, lessons, videos, estimated_hours, icon, locked, order_index)
VALUES
  ('Nhập môn VNDC',        'Cơ bản',    ARRAY['all'],        5,  2, 2.0, 'Rocket',         false, 1),
  ('Kỹ năng CSKH',         'Cơ bản',    ARRAY['CSKH'],       8,  3, 4.0, 'HeartHandshake', false, 2),
  ('Nghiệp vụ Kinh doanh', 'Trung cấp', ARRAY['Kinh doanh'], 10, 4, 6.0, 'TrendingUp',     false, 3),
  ('Kỹ thuật cơ bản',      'Trung cấp', ARRAY['Kỹ thuật'],   12, 5, 8.0, 'Wrench',         false, 4),
  ('Quản lý nâng cao',     'Nâng cao',  ARRAY['all'],        6,  2, 5.0, 'Crown',          true,  5),
  ('Chuyên gia nội bộ',    'Chuyên gia',ARRAY['all'],        4,  1, 3.0, 'Award',          true,  6)
ON CONFLICT DO NOTHING;

-- Seed admin account
-- password: 123456 — bcrypt hash (salt rounds=10)
INSERT INTO users (email, password, name, department, role)
VALUES (
  'admin@vndc.vn',
  '$2a$10$DXEmozfl5hgbGEMlBIKLxeFOMKjefqYUAsEs8nasoHU9I2jUHc2tG',
  'Nguyễn Admin',
  'Quản trị',
  'admin'
) ON CONFLICT (email) DO NOTHING;
