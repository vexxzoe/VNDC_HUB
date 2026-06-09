import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Badge, Button } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { normalizeAudience } from '@/utils/permissions';
import { Search, FileText, Table2, BookOpen, Download, ExternalLink, Share2, Edit, Link2, Info, Calendar, Tag, Users } from 'lucide-react';

const FORMS = [
  { id:"f1", name:"BM-09: Đổi trả hàng",           type:"PDF",    dept:"Vận hành",   audience:["all"],              version:"v1.1", updatedAt:"2025-05-20", desc:"Biểu mẫu xử lý yêu cầu đổi trả từ khách hàng. Áp dụng cho tất cả phòng ban liên quan đến dịch vụ khách hàng." },
  { id:"f2", name:"BM-15: Đơn xin nghỉ phép",      type:"PDF",    dept:"Nhân sự",    audience:["all"],              version:"v1.0", updatedAt:"2025-01-10", desc:"Mẫu đơn xin nghỉ phép năm, nghỉ ốm, nghỉ không lương. Nộp trước 3 ngày làm việc." },
  { id:"f3", name:"BM-03: Báo cáo công việc tuần", type:"Excel",  dept:"Vận hành",   audience:["all"],              version:"v2.0", updatedAt:"2025-04-15", desc:"Template báo cáo kết quả công việc tuần. Gửi cho quản lý trực tiếp trước 17h thứ Sáu." },
  { id:"f4", name:"QT-01: Quy trình bán hàng",     type:"PDF",    dept:"Kinh doanh", audience:["Kinh doanh"],       version:"v3.1", updatedAt:"2025-05-01", desc:"Quy trình chuẩn từ tiếp cận khách hàng đến chốt đơn. Bắt buộc áp dụng cho toàn bộ nhân viên kinh doanh." },
  { id:"f5", name:"QT-03: Xử lý khiếu nại",        type:"PDF",    dept:"CSKH",       audience:["CSKH","Kinh doanh"],version:"v1.5", updatedAt:"2025-04-30", desc:"Quy trình tiếp nhận và xử lý phản hồi, khiếu nại từ khách hàng trong vòng 24 giờ." },
  { id:"f6", name:"QT-05: Kiểm tra kỹ thuật",      type:"PDF",    dept:"Kỹ thuật",   audience:["Kỹ thuật"],         version:"v2.2", updatedAt:"2025-03-20", desc:"Quy trình kiểm tra định kỳ thiết bị và hệ thống. Thực hiện hàng tháng." },
  { id:"f7", name:"BM-22: Đề xuất mua sắm",        type:"Excel",  dept:"Vận hành",   audience:["all"],              version:"v1.0", updatedAt:"2025-02-28", desc:"Mẫu đề xuất mua sắm thiết bị, vật tư. Cần được duyệt bởi quản lý phòng ban và ban giám đốc." },
  { id:"f8", name:"QT-08: Onboarding nhân viên",   type:"Module", dept:"Nhân sự",    audience:["all"],              version:"v1.2", updatedAt:"2025-05-12", desc:"Quy trình hội nhập nhân viên mới trong 30 ngày đầu. Trách nhiệm của HR và quản lý trực tiếp." },
];

const TYPES = ['Tất cả', 'PDF', 'Excel', 'Module'];

const ICON_MAP = {
  PDF: FileText,
  Excel: Table2,
  Module: BookOpen
};

const COLOR_MAP = {
  PDF: 'bg-red-50 text-red-500',
  Excel: 'bg-green-50 text-green-600',
  Module: 'bg-purple-50 text-purple-600'
};

export default function FormsPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [selectedForm, setSelectedForm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('Tất cả');



  const filteredForms = FORMS.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        f.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'Tất cả' || f.type === filterType;
    return matchSearch && matchType;
  });

  const getRelated = (form) => {
    if (!form) return [];
    return FORMS.filter(f => {
      if (f.id === form.id) return false;
      const fAudience = normalizeAudience(f.audience);
      const formAudience = normalizeAudience(form.audience);
      return f.dept === form.dept || fAudience.some(a => formAudience.includes(a));
    }).slice(0, 3);
  };

  const renderGuide = (type) => {
    if (type === 'PDF') return "Tải xuống, in ra hoặc điền trực tiếp. Nộp lại cho bộ phận liên quan sau khi hoàn tất.";
    if (type === 'Excel') return "Mở bằng Excel hoặc Google Sheets. Điền đầy đủ thông tin vào các ô được đánh dấu và gửi qua email.";
    if (type === 'Module') return "Đọc kỹ các bước trước khi thực hiện quy trình. Liên hệ quản lý trực tiếp nếu có thắc mắc.";
    return "";
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-6">
      {/* SIDEBAR LIST */}
      <div className="w-full md:w-80 flex-shrink-0 bg-white border border-surface-200 rounded-2xl overflow-hidden md:sticky md:top-20 h-fit flex flex-col max-h-[800px] shadow-sm">
        <div className="px-4 py-3 border-b border-surface-100 bg-surface-50 flex items-center justify-between">
          <h3 className="font-semibold text-surface-900">Biểu mẫu & Quy trình</h3>
          <Badge variant="default" className="text-[10px] text-surface-500 bg-surface-100">{FORMS.length} tài liệu</Badge>
        </div>

        <div className="px-3 py-3 border-b border-surface-100 relative bg-white">
          <Search className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-surface-400" />
          <input 
            type="text" 
            placeholder="Tìm biểu mẫu..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-surface-50 border border-surface-200 rounded-xl pl-9 pr-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary-500 transition-shadow"
          />
        </div>

        <div className="px-3 py-3 border-b border-surface-100 flex gap-1.5 flex-wrap bg-white">
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={clsx(
                "px-3 py-1.5 text-[11px] font-semibold rounded-full transition-colors",
                filterType === t ? "bg-primary-600 text-white" : "bg-surface-100 text-surface-600 hover:bg-surface-200"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex md:flex-col overflow-x-auto md:overflow-y-auto flex-1 min-h-[140px] md:min-h-[300px] bg-white scrollbar-hide">
          {filteredForms.map(f => {
            const isActive = selectedForm?.id === f.id;
            const FIcon = ICON_MAP[f.type] || FileText;
            return (
              <div 
                key={f.id}
                onClick={() => setSelectedForm(f)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-surface-50 hover:bg-surface-50 transition-colors w-72 md:w-auto flex-shrink-0 md:flex-shrink",
                  isActive && "bg-primary-50 md:border-l-2 md:border-t-0 border-b-2 md:border-b-primary-50 border-primary-600"
                )}
              >
                <div className={clsx("w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center", COLOR_MAP[f.type])}>
                  <FIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={clsx("text-sm font-semibold line-clamp-1", isActive ? "text-primary-700" : "text-surface-900")}>{f.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4">{f.dept}</Badge>
                    <span className="text-xs text-surface-500 font-medium">{f.version}</span>
                  </div>
                </div>
              </div>
            )
          })}
          {filteredForms.length === 0 && (
            <div className="p-8 text-center text-surface-500 text-sm font-medium w-full">Không tìm thấy biểu mẫu.</div>
          )}
        </div>
      </div>

      {/* CONTENT PANEL */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {!selectedForm ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-surface-50/50 rounded-2xl border-2 border-surface-200 border-dashed"
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <FileText className="w-10 h-10 text-surface-300" />
              </div>
              <p className="font-bold text-surface-700 text-lg">Chọn biểu mẫu để xem chi tiết</p>
              <p className="text-sm font-medium text-surface-400 mt-2">← Chọn từ danh sách biểu mẫu</p>
            </motion.div>
          ) : (
            <motion.div
              key={selectedForm.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header card */}
              <div className="bg-white border border-surface-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className={clsx("w-16 h-16 rounded-2xl flex items-center justify-center shrink-0", COLOR_MAP[selectedForm.type])}>
                    {React.createElement(ICON_MAP[selectedForm.type] || FileText, { className: "w-8 h-8" })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-surface-900 leading-tight">{selectedForm.name}</h2>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">{selectedForm.type}</Badge>
                      <Badge variant="default" className="text-xs font-semibold px-2 py-0.5">{selectedForm.dept}</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-5 text-sm text-surface-500 font-medium mt-6 bg-surface-50 p-4 rounded-xl border border-surface-100">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-surface-400" /> Cập nhật: {selectedForm.updatedAt}</div>
                  <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-surface-400" /> {selectedForm.version}</div>
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 text-surface-400" /> {selectedForm.audience.map(a => a==='all'?'Toàn công ty':a).join(", ")}</div>
                </div>

                <div className="mt-6 p-5 bg-white border border-surface-100 rounded-xl text-sm leading-relaxed text-surface-700 shadow-sm font-medium">
                  {selectedForm.desc}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="primary" icon={Download} onClick={() => toast.success(`Đang tải ${selectedForm.name}...`)}>Tải xuống</Button>
                  <Button variant="secondary" icon={ExternalLink} onClick={() => toast.info("Trình xem sẽ được tích hợp sau")}>Mở xem trước</Button>
                  <Button variant="ghost" icon={Share2} onClick={() => toast.success("Đã sao chép link!")}>Chia sẻ</Button>
                  {isAdmin && <Button variant="ghost" icon={Edit} className="text-surface-500">Chỉnh sửa</Button>}
                </div>
              </div>

              {/* Related section */}
              <div className="mt-8">
                <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2 text-lg">
                  <Link2 className="w-5 h-5 text-primary-500" /> Tài liệu liên quan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  {getRelated(selectedForm).map(r => (
                    <div 
                      key={r.id} 
                      onClick={() => setSelectedForm(r)}
                      className="flex items-center gap-3 bg-white border border-surface-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-card cursor-pointer transition-all group"
                    >
                      <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", COLOR_MAP[r.type])}>
                        {React.createElement(ICON_MAP[r.type] || FileText, { className: "w-5 h-5" })}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="font-semibold text-sm text-surface-900 line-clamp-1 group-hover:text-primary-700 transition-colors">{r.name}</p>
                        <div className="flex gap-2 mt-1.5">
                          <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4">{r.dept}</Badge>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">{r.type}</Badge>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform">Xem →</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage guide */}
              <div className="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 mb-1">Hướng dẫn sử dụng</h4>
                  <p className="text-sm text-amber-800 leading-relaxed font-medium">{renderGuide(selectedForm.type)}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
