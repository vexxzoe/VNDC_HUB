-- Quiz questions cho mod-01 (Nhập môn VNDC)
-- Lấy module id trước:
-- SELECT id FROM modules WHERE title = 'Nhập môn VNDC';
-- Dùng id đó trong INSERT

DO $$
DECLARE
  mod1_id UUID;
  mod2_id UUID;
  mod3_id UUID;
BEGIN
  SELECT id INTO mod1_id FROM modules WHERE title = 'Nhập môn VNDC';
  SELECT id INTO mod2_id FROM modules WHERE title = 'Kỹ năng CSKH';
  SELECT id INTO mod3_id FROM modules WHERE title = 'Nghiệp vụ Kinh doanh';

  -- Module 1
  INSERT INTO quiz_questions (module_id,question,options,answer,order_index) VALUES
  (mod1_id,'VNDC HUB được dùng để làm gì?',
   ARRAY['Quản lý tài chính','Quản lý tri thức & đào tạo nội bộ','Quản lý kho hàng','Chấm công'],1,1),
  (mod1_id,'Tài khoản nào có toàn quyền quản trị?',
   ARRAY['member','guest','admin','viewer'],2,2),
  (mod1_id,'Định dạng file nào KHÔNG có trong thư viện?',
   ARRAY['PDF','Excel','PSD','Video'],2,3),
  (mod1_id,'Trợ lý AI trong VNDC HUB dùng model nào?',
   ARRAY['GPT-4','Gemini','Claude Sonnet','LLaMA'],1,4),
  (mod1_id,'Module bị khoá sẽ mở sau khi?',
   ARRAY['Đăng ký thêm','Admin mở khoá','Hoàn thành module trước','Tự động sau 7 ngày'],1,5);

  -- Module 2
  INSERT INTO quiz_questions (module_id,question,options,answer,order_index) VALUES
  (mod2_id,'Biểu mẫu xử lý hoàn trả hàng là?',
   ARRAY['BM-14','BM-09','BM-15','BM-01'],1,1),
  (mod2_id,'SLA phản hồi khách hàng chuẩn là?',
   ARRAY['48 giờ','72 giờ','24 giờ','1 tuần'],2,2),
  (mod2_id,'Khi khách khiếu nại, bước đầu tiên là?',
   ARRAY['Báo cáo lên quản lý','Lắng nghe và xác nhận vấn đề','Hoàn tiền ngay','Chuyển bộ phận khác'],1,3),
  (mod2_id,'Quy trình nào dùng cho đổi trả hàng?',
   ARRAY['QT-01','QT-05','QT-03','QT-08'],2,4),
  (mod2_id,'Phần mềm CRM hiện tại là?',
   ARRAY['Salesforce','HubSpot','Phần mềm nội bộ','Zoho'],2,5);

  -- Module 3
  INSERT INTO quiz_questions (module_id,question,options,answer,order_index) VALUES
  (mod3_id,'Bảng giá sản phẩm cập nhật định kỳ theo?',
   ARRAY['Tháng','Quý','Năm','Tuần'],1,1),
  (mod3_id,'KPI doanh số tính theo đơn vị nào?',
   ARRAY['Số đơn hàng','Doanh thu thuần','Lợi nhuận gộp','Tất cả đáp án'],3,2),
  (mod3_id,'Quy trình báo giá gồm bao nhiêu bước?',
   ARRAY['3','4','5','6'],2,3),
  (mod3_id,'Chiết khấu tối đa nhân viên được áp dụng?',
   ARRAY['5%','10%','15%','20%'],1,4),
  (mod3_id,'Công cụ quản lý pipeline bán hàng?',
   ARRAY['Excel','CRM nội bộ','Trello','Email'],1,5);
END $$;
