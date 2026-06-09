// DOCUMENTS — 15 items
export const DOCUMENTS = [
  { id:"doc-01", name:"Quy trình đổi trả hàng", type:"PDF",    department:"CSKH",       audience:["CSKH","Kinh doanh"], version:"v2.1", views:142, bookmarked:false, size:"1.2 MB", tag:"quy-trinh", updatedAt:"2025-05-10", icon:"FileText" },
  { id:"doc-02", name:"Bảng giá sản phẩm Q2/2025", type:"Excel",  department:"Kinh doanh", audience:["Kinh doanh"],          version:"v1.4", views:98,  bookmarked:true,  size:"0.8 MB", tag:"bang-gia",  updatedAt:"2025-05-18", icon:"Table2" },
  { id:"doc-03", name:"Hướng dẫn bảo hành thiết bị", type:"PDF",    department:"Kỹ thuật",   audience:["Kỹ thuật","CSKH"],   version:"v3.0", views:76,  bookmarked:false, size:"2.1 MB", tag:"bao-hanh",  updatedAt:"2025-04-22", icon:"FileText" },
  { id:"doc-04", name:"Video onboarding nhân viên mới", type:"Video",  department:"Chung",      audience:["all"],               version:"v1.0", views:210, bookmarked:true,  size:"145 MB", tag:"onboarding",updatedAt:"2025-03-15", icon:"Video" },
  { id:"doc-05", name:"Chính sách KPI phòng CSKH", type:"PDF",    department:"CSKH",       audience:["CSKH"],              version:"v1.2", views:55,  bookmarked:false, size:"0.5 MB", tag:"kpi",       updatedAt:"2025-05-01", icon:"FileText" },
  { id:"doc-06", name:"Module kỹ thuật cơ bản", type:"Module", department:"Kỹ thuật",   audience:["Kỹ thuật"],          version:"v2.0", views:89,  bookmarked:false, size:"—",      tag:"module",    updatedAt:"2025-04-10", icon:"BookOpen" },
  { id:"doc-07", name:"Biểu mẫu BM-09: Hoàn trả hàng", type:"PDF",    department:"Vận hành",   audience:["all"],               version:"v1.1", views:201, bookmarked:true,  size:"0.3 MB", tag:"bieu-mau",  updatedAt:"2025-05-20", icon:"ClipboardList" },
  { id:"doc-08", name:"Quy trình xử lý khiếu nại", type:"PDF",    department:"CSKH",       audience:["CSKH"],              version:"v1.5", views:63,  bookmarked:false, size:"0.9 MB", tag:"quy-trinh", updatedAt:"2025-04-30", icon:"FileText" },
  { id:"doc-09", name:"Video hướng dẫn dùng phần mềm CRM", type:"Video",  department:"Kinh doanh", audience:["Kinh doanh","CSKH"], version:"v1.0", views:134, bookmarked:false, size:"210 MB", tag:"crm",       updatedAt:"2025-05-05", icon:"Video" },
  { id:"doc-10", name:"Báo cáo doanh thu tháng 4", type:"Excel",  department:"Kinh doanh", audience:["Kinh doanh"],          version:"v1.0", views:45,  bookmarked:false, size:"1.5 MB", tag:"bao-cao",   updatedAt:"2025-05-02", icon:"Table2" },
  { id:"doc-11", name:"Chính sách bảo mật nội bộ", type:"PDF",    department:"Chung",      audience:["all"],               version:"v2.0", views:38,  bookmarked:false, size:"0.4 MB", tag:"chinh-sach",updatedAt:"2025-03-01", icon:"ShieldCheck" },
  { id:"doc-12", name:"Hướng dẫn sử dụng thiết bị văn phòng", type:"PDF",    department:"Kỹ thuật",   audience:["all"],               version:"v1.0", views:29,  bookmarked:false, size:"1.1 MB", tag:"huong-dan", updatedAt:"2025-02-14", icon:"FileText" },
  { id:"doc-13", name:"Module kinh doanh nâng cao", type:"Module", department:"Kinh doanh", audience:["Kinh doanh"],          version:"v1.3", views:67,  bookmarked:true,  size:"—",      tag:"module",    updatedAt:"2025-04-25", icon:"BookOpen" },
  { id:"doc-14", name:"Biểu mẫu BM-15: Nghỉ phép", type:"PDF",    department:"Nhân sự",    audience:["all"],               version:"v1.0", views:188, bookmarked:false, size:"0.2 MB", tag:"bieu-mau",  updatedAt:"2025-01-10", icon:"FileText" },
  { id:"doc-15", name:"Quy trình onboarding kỹ thuật", type:"Module", department:"Kỹ thuật",   audience:["Kỹ thuật"],          version:"v1.1", views:52,  bookmarked:false, size:"—",      tag:"onboarding",updatedAt:"2025-05-12", icon:"BookOpen" },
]

// MODULES — 6 learning paths
export const MODULES = [
  { id:"mod-01", title:"Nhập môn VNDC",          level:"Cơ bản",    department:["all"],          lessons:5,  videos:2, estimatedHours:2,  progress:100, quizScore:90, locked:false, icon:"Rocket" },
  { id:"mod-02", title:"Kỹ năng CSKH",           level:"Cơ bản",    department:["CSKH"],         lessons:8,  videos:3, estimatedHours:4,  progress:60,  quizScore:null, locked:false, icon:"HeartHandshake" },
  { id:"mod-03", title:"Nghiệp vụ Kinh doanh",   level:"Trung cấp", department:["Kinh doanh"],   lessons:10, videos:4, estimatedHours:6,  progress:30,  quizScore:null, locked:false, icon:"TrendingUp" },
  { id:"mod-04", title:"Kỹ thuật cơ bản",        level:"Trung cấp", department:["Kỹ thuật"],     lessons:12, videos:5, estimatedHours:8,  progress:0,   quizScore:null, locked:false, icon:"Wrench" },
  { id:"mod-05", title:"Quản lý nâng cao",        level:"Nâng cao",  department:["all"],          lessons:6,  videos:2, estimatedHours:5,  progress:0,   quizScore:null, locked:true,  icon:"Crown" },
  { id:"mod-06", title:"Chuyên gia nội bộ",      level:"Chuyên gia",department:["all"],          lessons:4,  videos:1, estimatedHours:3,  progress:0,   quizScore:null, locked:true,  icon:"Award" },
]

// EMPLOYEES — 8 people
export const EMPLOYEES = [
  { id:"emp-01", name:"Nguyễn Admin",    email:"admin@vndc.vn",   department:"Quản trị",   role:"admin",  joinedAt:"2023-01-10" },
  { id:"emp-02", name:"Trần Kinh Doanh", email:"sales@vndc.vn",   department:"Kinh doanh", role:"member", joinedAt:"2023-03-15" },
  { id:"emp-03", name:"Lê Chăm Sóc",    email:"cskh@vndc.vn",    department:"CSKH",       role:"member", joinedAt:"2023-04-01" },
  { id:"emp-04", name:"Phạm Kỹ Thuật",  email:"tech@vndc.vn",    department:"Kỹ thuật",   role:"member", joinedAt:"2023-05-20" },
  { id:"emp-05", name:"Hoàng Vân Anh",  email:"vananh@vndc.vn",  department:"Kinh doanh", role:"member", joinedAt:"2023-07-11" },
  { id:"emp-06", name:"Đinh Minh Khôi", email:"khoi@vndc.vn",    department:"Kỹ thuật",   role:"member", joinedAt:"2023-09-03" },
  { id:"emp-07", name:"Bùi Thu Hà",     email:"thuha@vndc.vn",   department:"CSKH",       role:"member", joinedAt:"2024-01-08" },
  { id:"emp-08", name:"Ngô Thanh Long", email:"long@vndc.vn",    department:"Nhân sự",    role:"member", joinedAt:"2024-03-22" },
]

// QUIZ QUESTIONS — 5 per module (only mod-01, mod-02, mod-03 active for now)
export const QUIZ_QUESTIONS = {
  "mod-01": [
    { id:"q1", question:"VNDC HUB được dùng để làm gì?", options:["Quản lý tài chính","Quản lý tri thức & đào tạo nội bộ","Quản lý kho hàng","Chấm công"], answer:1 },
    { id:"q2", question:"Tài khoản nào có toàn quyền quản trị?", options:["member","guest","admin","viewer"], answer:2 },
    { id:"q3", question:"Định dạng file nào KHÔNG có trong thư viện?", options:["PDF","Excel","PSD","Video"], answer:2 },
    { id:"q4", question:"Trợ lý AI trong VNDC HUB dùng model nào?", options:["GPT-4","Gemini","Claude Sonnet","LLaMA"], answer:2 },
    { id:"q5", question:"Module bị khoá sẽ mở sau khi?", options:["Đăng ký thêm","Admin mở khoá","Hoàn thành module trước","Tự động sau 7 ngày"], answer:2 },
  ],
  "mod-02": [
    { id:"q1", question:"Biểu mẫu xử lý hoàn trả hàng là?", options:["BM-14","BM-09","BM-15","BM-01"], answer:1 },
    { id:"q2", question:"SLA phản hồi khách hàng chuẩn là?", options:["48 giờ","72 giờ","24 giờ","1 tuần"], answer:2 },
    { id:"q3", question:"Khi khách khiếu nại, bước đầu tiên là?", options:["Báo cáo lên quản lý","Lắng nghe và xác nhận vấn đề","Hoàn tiền ngay","Chuyển sang bộ phận khác"], answer:1 },
    { id:"q4", question:"Quy trình nào dùng cho đổi trả hàng?", options:["QT-01","QT-05","QT-03","QT-08"], answer:2 },
    { id:"q5", question:"Phần mềm CRM hiện tại của công ty là?", options:["Salesforce","HubSpot","Phần mềm nội bộ","Zoho"], answer:2 },
  ],
  "mod-03": [
    { id:"q1", question:"Bảng giá sản phẩm cập nhật định kỳ theo?", options:["Tháng","Quý","Năm","Tuần"], answer:1 },
    { id:"q2", question:"KPI doanh số được tính theo đơn vị nào?", options:["Số đơn hàng","Doanh thu thuần","Lợi nhuận gộp","Tất cả đáp án"], answer:3 },
    { id:"q3", question:"Quy trình báo giá cho khách hàng gồm bao nhiêu bước?", options:["3","4","5","6"], answer:2 },
    { id:"q4", question:"Chiết khấu tối đa nhân viên kinh doanh được phép áp dụng?", options:["5%","10%","15%","20%"], answer:1 },
    { id:"q5", question:"Công cụ nào dùng để quản lý pipeline bán hàng?", options:["Excel","CRM nội bộ","Trello","Email"], answer:1 },
  ],
}

// DEPARTMENT PERMISSIONS
export const DEPARTMENT_PERMISSIONS = {
  "Kinh doanh": { library:true,  videos:true,  forms:true,  updates:false, analytics:false, people:false },
  "CSKH":       { library:true,  videos:true,  forms:true,  updates:false, analytics:false, people:false },
  "Kỹ thuật":   { library:true,  videos:true,  forms:true,  updates:true,  analytics:false, people:false },
  "Nhân sự":    { library:true,  videos:false, forms:true,  updates:false, analytics:false, people:true  },
  "Quản trị":   { library:true,  videos:true,  forms:true,  updates:true,  analytics:true,  people:true  },
}

// NOTIFICATIONS (mock)
export const NOTIFICATIONS = [
  { id:"n1", text:"Tài liệu BM-09 đã được cập nhật lên v1.1", time:"5 phút trước", icon:"FileText", read:false, link:"/library" },
  { id:"n2", text:"Module Kỹ thuật cơ bản vừa được mở khoá", time:"1 giờ trước",  icon:"Unlock",   read:false, link:"/courses" },
  { id:"n3", text:"Quiz Q1 sắp đến hạn — còn 2 ngày",        time:"2 giờ trước",  icon:"ClipboardCheck", read:true, link:"/quiz" },
]
