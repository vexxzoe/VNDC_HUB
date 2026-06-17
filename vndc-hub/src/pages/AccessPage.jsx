import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/utils/api';
import { DEPARTMENT_PERMISSIONS } from '@/data/mockData';
import { Badge } from '@/components/ui';
import { formatRelativeTime } from '@/utils/formatTime';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, AlertTriangle,
  Library, PlayCircle, FileText, Upload, BarChart2, Users
} from 'lucide-react';

const INITIAL_CHANGE_LOG = [
  { id:"c1", action:"Bật quyền updates", dept:"Kỹ thuật",   by:"Nguyễn Admin", time:"2025-05-20T10:00:00" },
  { id:"c2", action:"Duyệt tài khoản",   dept:"Kinh doanh", by:"Nguyễn Admin", time:"2025-05-18T14:00:00" },
  { id:"c3", action:"Tắt quyền people",  dept:"Nhân sự",    by:"Nguyễn Admin", time:"2025-05-15T09:00:00" },
];

const PERMISSION_LABELS = {
  library:   { label:"Thư viện",     icon: Library },
  videos:    { label:"Video",        icon: PlayCircle },
  forms:     { label:"Biểu mẫu",     icon: FileText },
  updates:   { label:"Cập nhật TL",  icon: Upload },
  analytics: { label:"Analytics",    icon: BarChart2 },
  people:    { label:"Nhân viên",    icon: Users },
};

const DEPARTMENTS = Object.keys(DEPARTMENT_PERMISSIONS);
const PERM_KEYS = Object.keys(PERMISSION_LABELS);

// Inline Toggle Switch
function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={onChange}
      className={clsx(
        'w-11 h-6 rounded-full cursor-pointer transition-colors p-0.5 flex shrink-0',
        checked ? 'bg-primary-500' : 'bg-surface-300'
      )}
    >
      <div
        className={clsx(
          'w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </div>
  );
}

export default function AccessPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [permissions, setPermissions] = useState(DEPARTMENT_PERMISSIONS);
  const [changeLog, setChangeLog] = useState(INITIAL_CHANGE_LOG);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [loading, setLoading] = useState(true);

  // THAY ĐỔI 1: Load permissions từ API
  useEffect(() => {
    api.getDeptPerms()
      .then(data => {
        const obj = {}
        data.permissions.forEach(p => { obj[p.department] = p })
        setPermissions(obj)
      })
      .catch(() => toast.error('Không thể tải phân quyền'))
      .finally(() => setLoading(false))
  }, [])

  // THAY ĐỔI 2: handleToggle gọi API thật + optimistic update
  const handleToggle = async (dept, permKey) => {
    const newVal = !permissions[dept]?.[permKey]
    setPermissions(prev => ({
      ...prev,
      [dept]: { ...prev[dept], [permKey]: newVal }
    }))
    try {
      await api.updateDeptPerm(dept, permKey, newVal)
      const logEntry = {
        id: 'c' + Date.now(),
        action: (newVal ? 'Bật' : 'Tắt') + ' quyền ' + (PERMISSION_LABELS[permKey]?.label || permKey),
        dept,
        by: user?.name || 'System',
        time: new Date().toISOString()
      }
      setChangeLog(prev => [logEntry, ...prev].slice(0, 20))
      toast.success(`${newVal ? 'Đã bật' : 'Đã tắt'} quyền ${PERMISSION_LABELS[permKey]?.label} cho ${dept}`)
    } catch (err) {
      // Rollback nếu API lỗi
      setPermissions(prev => ({
        ...prev,
        [dept]: { ...prev[dept], [permKey]: !newVal }
      }))
      toast.error('Không thể cập nhật quyền: ' + err.message)
    }
  };

  const visibleLogs = showAllLogs ? changeLog : changeLog.slice(0, 5);

  // THAY ĐỔI 6: Loading state
  if (loading) return <div className="p-8 text-center text-slate-400">Đang tải...</div>

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Phân quyền hệ thống</h1>
        <p className="text-sm text-surface-500 font-medium mt-1">Quản lý quyền truy cập theo phòng ban</p>
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 items-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">Thay đổi phân quyền có hiệu lực ngay lập tức với tất cả nhân viên</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        <div className="flex flex-col gap-8">
          {/* Permission Matrix */}
          <div>
            <h2 className="font-bold text-surface-900 mb-4 text-lg">Ma trận phân quyền</h2>
            <div className="bg-white border border-surface-200 rounded-2xl overflow-x-auto shadow-sm">
              <table className="w-full min-w-[700px]">
                <thead className="bg-surface-50 border-b border-surface-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-surface-500 uppercase tracking-wider w-40">Phòng ban</th>
                    {PERM_KEYS.map(k => {
                      const PIcon = PERMISSION_LABELS[k].icon;
                      return (
                        <th key={k} className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <PIcon className="w-4 h-4 text-surface-400" />
                            <span className="text-xs font-bold text-surface-500">{PERMISSION_LABELS[k].label}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {DEPARTMENTS.map(dept => (
                    <tr key={dept} className="hover:bg-surface-50/50 transition-colors">
                      <td className="px-4 py-4 font-semibold text-surface-900 whitespace-nowrap">{dept}</td>
                      {PERM_KEYS.map(k => (
                        <td key={k} className="px-4 py-4">
                          <div className="flex justify-center">
                            <Toggle
                              checked={permissions[dept][k]}
                              onChange={() => handleToggle(dept, k)}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">

          {/* Change Log */}
          <div>
            <h2 className="font-bold text-surface-900 mb-3 text-lg">Lịch sử thay đổi</h2>
            <div className="bg-white border border-surface-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="divide-y divide-surface-100">
                <AnimatePresence>
                  {visibleLogs.map(log => {
                    const isEnable = log.action.includes('Bật');
                    const isDisable = log.action.includes('Tắt');
                    const color = isEnable ? 'bg-green-500' : isDisable ? 'bg-red-500' : 'bg-blue-500';
                    return (
                      <motion.div
                        key={log.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3 px-4 py-3 items-start hover:bg-surface-50 transition-colors"
                      >
                        <div className={clsx('w-2 h-2 rounded-full shrink-0 mt-1.5', color)} />
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                          <p className="font-bold text-sm text-surface-900">{log.action}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="default" className="text-[10px] px-1.5 py-0">{log.dept}</Badge>
                            <span className="text-xs text-surface-500 font-medium">bởi {log.by}</span>
                          </div>
                        </div>
                        <span className="text-xs text-surface-400 shrink-0 font-medium">{formatRelativeTime(log.time)}</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              {changeLog.length > 5 && (
                <button
                  onClick={() => setShowAllLogs(p => !p)}
                  className="w-full py-3 text-xs font-semibold text-surface-500 hover:text-surface-900 hover:bg-surface-50 transition-colors border-t border-surface-100"
                >
                  {showAllLogs ? 'Thu gọn' : 'Xem thêm'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
