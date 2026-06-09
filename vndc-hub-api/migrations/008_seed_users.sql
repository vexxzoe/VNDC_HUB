-- password: 123456
INSERT INTO users (email, password, name, department, role) VALUES
  ('sales@vndc.vn',
   '$2a$10$DXEmozfl5hgbGEMlBIKLxeFOMKjefqYUAsEs8nasoHU9I2jUHc2tG',
   'Trần Kinh Doanh', 'Kinh doanh', 'member'),
  ('cskh@vndc.vn',
   '$2a$10$DXEmozfl5hgbGEMlBIKLxeFOMKjefqYUAsEs8nasoHU9I2jUHc2tG',
   'Lê Chăm Sóc', 'CSKH', 'member'),
  ('tech@vndc.vn',
   '$2a$10$DXEmozfl5hgbGEMlBIKLxeFOMKjefqYUAsEs8nasoHU9I2jUHc2tG',
   'Phạm Kỹ Thuật', 'Kỹ thuật', 'member')
ON CONFLICT (email) DO NOTHING;
