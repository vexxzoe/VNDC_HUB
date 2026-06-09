import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DOCUMENTS, MODULES, EMPLOYEES } from '@/data/mockData';
import { normalizeDept } from '@/utils/permissions';
import { useCountUp } from '@/hooks/useCountUp';
import { Badge, Button } from '@/components/ui';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
  Files, Eye, Users, TrendingUp, Info,
  Upload, CheckCircle2, Award, ShieldCheck, Bot, UserPlus, BookOpen,
  FileText, Table2, Video
} from 'lucide-react';

const MISSING_KEYWORDS = [
  { keyword: "hợp đồng lao động", searches: 23, priority: "high" },
  { keyword: "phụ cấp xe",        searches: 18, priority: "high" },
  { keyword: "mẫu đánh giá KPI",  searches: 15, priority: "medium" },
  { keyword: "quy trình tuyển dụng", searches: 12, priority: "medium" },
  { keyword: "bảng lương",        searches: 9,  priority: "low" },
  { keyword: "nội quy văn phòng", searches: 7,  priority: "low" },
];

const ACTIVITY = [
  { id: 1, text: "Nguyễn Admin tải lên Chính sách bảo mật 2025",  time: "2 giờ trước",   icon: Upload,      color: "blue" },
  { id: 2, text: "Lê Chăm Sóc hoàn thành Module Kỹ năng CSKH",    time: "5 giờ trước",   icon: CheckCircle2,color: "green" },
  { id: 3, text: "Trần Kinh Doanh đạt Quiz Nghiệp vụ KD — 85đ",   time: "Hôm qua",       icon: Award,       color: "primary" },
  { id: 4, text: "Phạm Kỹ Thuật xem Hướng dẫn bảo hành thiết bị", time: "Hôm qua",       icon: Eye,         color: "teal" },
  { id: 5, text: "Nguyễn Admin duyệt Module onboarding kỹ thuật", time: "2 ngày trước",  icon: ShieldCheck, color: "green" },
  { id: 6, text: "AI học xong Chính sách bảo mật 2025",           time: "3 ngày trước",  icon: Bot,         color: "purple" },
  { id: 7, text: "Hoàng Vân Anh đăng ký tài khoản mới",           time: "4 ngày trước",  icon: UserPlus,    color: "blue" },
  { id: 8, text: "Bùi Thu Hà bắt đầu Lộ trình CSKH",              time: "5 ngày trước",  icon: BookOpen,    color: "amber" },
];

const DEPARTMENTS = ['Kinh doanh', 'CSKH', 'Kỹ thuật', 'Nhân sự', 'Chung'];
const FILE_ICONS = { PDF: FileText, Excel: Table2, Video: Video, Module: BookOpen };
const FILE_COLORS = { PDF: 'text-red-500 bg-red-50', Excel: 'text-green-600 bg-green-50', Video: 'text-blue-500 bg-blue-50', Module: 'text-purple-600 bg-purple-50' };
const RANK_COLORS = ['bg-primary-500', 'bg-primary-400', 'bg-primary-300', 'bg-surface-300', 'bg-surface-200'];

const ACTIVITY_COLORS = {
  blue: 'bg-blue-50 text-blue-500',
  green: 'bg-green-50 text-green-600',
  primary: 'bg-primary-50 text-primary-600',
  teal: 'bg-teal-50 text-teal-600',
  purple: 'bg-purple-50 text-purple-600',
  amber: 'bg-amber-50 text-amber-500',
};

function KpiCard({ icon: Icon, title, value, trend, iconColor }) {
  return (
    <div className="bg-white border border-surface-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-surface-50', iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-surface-600">{title}</p>
      </div>
      <p className="text-3xl font-extrabold text-surface-900">{value}</p>
      <p className={clsx('text-xs font-medium mt-2', trend.includes('+') || trend.includes('1/6') ? 'text-green-600' : 'text-surface-500')}>{trend}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [period, setPeriod] = useState('month');

  const totalDocsCount = useCountUp(DOCUMENTS.length, 1000);
  const totalViewsVal = DOCUMENTS.reduce((s, d) => s + d.views, 0);
  const totalViewsCount = useCountUp(totalViewsVal, 1000);
  const totalEmpCount = useCountUp(EMPLOYEES.length, 1000);
  const compRate = Math.round((MODULES.filter(m => m.progress === 100).length / MODULES.length) * 100);

  const topDocs = [...DOCUMENTS].sort((a, b) => b.views - a.views).slice(0, 5);
  const maxViews = Math.max(...topDocs.map(d => d.views));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Analytics</h1>
          <p className="text-sm text-surface-500 font-medium mt-1">Tổng quan hoạt động hệ thống</p>
        </div>
        <div className="flex p-1 bg-surface-100 rounded-xl w-fit">
          {['week', 'month', 'quarter'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                'px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors',
                period === p ? 'bg-primary-600 text-white shadow-sm' : 'text-surface-500 hover:text-surface-900'
              )}
            >
              {p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : 'Quý'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Files} title="Tổng tài liệu" value={totalDocsCount} trend="↑ +2 tháng này" iconColor="text-primary-600" />
        <KpiCard icon={Eye} title="Lượt xem tổng" value={totalViewsCount} trend="↑ +12% so với tháng trước" iconColor="text-blue-500" />
        <KpiCard icon={Users} title="Nhân viên active" value={totalEmpCount} trend="↑ +1 nhân viên mới" iconColor="text-teal-600" />
        <KpiCard icon={TrendingUp} title="Tỉ lệ hoàn thành" value={`${compRate}%`} trend="1/6 module hoàn tất" iconColor="text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        <div className="flex flex-col gap-8">
          {/* Top Docs Chart */}
          <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="font-bold text-surface-900 text-lg">Tài liệu phổ biến nhất</h2>
              <Badge variant="surface" className="text-xs">theo lượt xem</Badge>
            </div>
            <div className="flex flex-col gap-4">
              {topDocs.map((doc, idx) => {
                const Icon = FILE_ICONS[doc.type] || FileText;
                const widthPct = (doc.views / maxViews) * 100;
                const isSmall = widthPct < 15;
                return (
                  <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-full sm:w-48 flex items-center gap-2 shrink-0 min-w-0">
                      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', FILE_COLORS[doc.type] || FILE_COLORS.PDF)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold text-surface-800 truncate" title={doc.name}>{doc.name}</span>
                    </div>
                    <div className="flex-1 h-8 bg-surface-100 rounded-lg overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{ duration: 1, delay: idx * 0.1, ease: 'easeOut' }}
                        className={clsx('h-full rounded-lg relative', RANK_COLORS[idx] || RANK_COLORS[4])}
                      >
                        {!isSmall && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white font-bold text-xs">
                            {doc.views}
                          </span>
                        )}
                      </motion.div>
                      {isSmall && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-surface-600 font-bold text-xs" style={{ left: `calc(${widthPct}% + 8px)` }}>
                          {doc.views}
                        </span>
                      )}
                    </div>
                    <div className="hidden sm:block w-16 text-right shrink-0">
                      <span className="text-xs text-surface-500 font-medium">lượt</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department Completion Table */}
          <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm overflow-hidden">
            <h2 className="font-bold text-surface-900 text-lg mb-4">Tiến độ đào tạo theo phòng ban</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-surface-100">
                    <th className="py-3 px-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Phòng ban</th>
                    <th className="py-3 px-4 text-xs font-bold text-surface-400 uppercase tracking-wider text-center">Được giao</th>
                    <th className="py-3 px-4 text-xs font-bold text-surface-400 uppercase tracking-wider text-center">Hoàn thành</th>
                    <th className="py-3 px-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Tiến độ TB</th>
                    <th className="py-3 px-4 text-xs font-bold text-surface-400 uppercase tracking-wider text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50">
                  {DEPARTMENTS.map(dept => {
                    const empCount = EMPLOYEES.filter(e => e.department === dept || dept === 'Chung').length;
                    const assigned = MODULES.filter(m => {
                      const d = normalizeDept(m.department);
                      return d.includes(dept) || d.includes('all');
                    });
                    const completed = assigned.filter(m => m.progress === 100).length;
                    const avg = assigned.length ? Math.round(assigned.reduce((s, m) => s + m.progress, 0) / assigned.length) : 0;
                    
                    let statusColor = 'danger'; let statusText = 'Cần chú ý';
                    if (avg >= 80) { statusColor = 'success'; statusText = 'Tốt'; }
                    else if (avg >= 50) { statusColor = 'warning'; statusText = 'Đang học'; }

                    return (
                      <tr key={dept} className="hover:bg-surface-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-surface-900">{dept}</span>
                            <Badge variant="surface" className="text-[10px] px-1.5 py-0">{empCount}</Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-surface-600">{assigned.length}</td>
                        <td className="py-3 px-4 text-center font-medium text-surface-600">{completed}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-surface-800 w-8">{avg}%</span>
                            <div className="w-24 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }} animate={{ width: `${avg}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={clsx('h-full', avg >= 80 ? 'bg-green-500' : avg >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge variant={statusColor}>{statusText}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Missing Keywords */}
          <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-bold text-surface-900 text-lg">Từ khoá thiếu tài liệu</h2>
              <div className="group relative">
                <Info className="w-4 h-4 text-surface-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-surface-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-center pointer-events-none z-10">
                  Dựa trên từ khoá tìm kiếm không ra kết quả
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {MISSING_KEYWORDS.map((item, i) => {
                const color = item.priority === 'high' ? 'bg-red-500' : item.priority === 'medium' ? 'bg-amber-500' : 'bg-surface-400';
                const badgeVar = item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'surface';
                const badgeTxt = item.priority === 'high' ? 'Ưu tiên cao' : item.priority === 'medium' ? 'Trung bình' : 'Thấp';
                return (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-surface-100 rounded-xl hover:bg-surface-50 transition-colors gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={clsx('w-2 h-2 rounded-full shrink-0', color)} />
                      <span className="font-medium text-sm text-surface-800 truncate">{item.keyword}</span>
                      <span className="text-xs text-surface-500 shrink-0 ml-1">{item.searches} lượt tìm</span>
                    </div>
                    <div className="flex items-center gap-2 justify-between sm:justify-end shrink-0">
                      <Badge variant={badgeVar} className="text-[10px]">{badgeTxt}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-surface-900 text-lg mb-6">Hoạt động gần đây</h2>
            <div className="pl-2">
              {ACTIVITY.map((item, i) => {
                const Icon = item.icon;
                const isLast = i === ACTIVITY.length - 1;
                return (
                  <div key={item.id} className="relative flex gap-4 pb-5">
                    {!isLast && <div className="absolute top-8 left-4 bottom-0 w-px border-l-2 border-dashed border-surface-200" />}
                    <div className={clsx('relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white', ACTIVITY_COLORS[item.color] || ACTIVITY_COLORS.primary)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1.5">
                      <p className="font-medium text-sm text-surface-800 line-clamp-2 leading-relaxed">{item.text}</p>
                      <p className="text-xs text-surface-500 mt-1">{item.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
