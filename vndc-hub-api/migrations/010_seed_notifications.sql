INSERT INTO notifications (user_id, text, icon, link, is_read) VALUES
  (NULL, 'Tài liệu BM-09 đã được cập nhật lên v1.1', 'FileText', '/library', false),
  (NULL, 'Module Kỹ thuật cơ bản vừa được mở khoá',  'Unlock',   '/courses', false),
  (NULL, 'Quiz Q1 sắp đến hạn — còn 2 ngày',         'ClipboardCheck', '/quiz', true)
ON CONFLICT DO NOTHING;
