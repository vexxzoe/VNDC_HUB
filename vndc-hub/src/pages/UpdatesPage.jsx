import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/utils/api';
import { Badge, Button } from '@/components/ui';
import { formatRelativeTime } from '@/utils/formatTime';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  Files, Clock, CheckCircle2, Upload, Bot, BellRing, Trash2,
  Building2, Users, FileText, Table2, Video, BookOpen,
  ClipboardList, Eye, Bell
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_TASKS = [
  { id:"t1", name:"Quy trình đổi trả v2.2",        file:"QT-doitra-v2.2.pdf",    dept:"CSKH",       audience:["CSKH","Kinh doanh"], status:"pending",    progress:0,   createdAt:"2025-05-20T09:00:00" },
  { id:"t2", name:"Bảng giá Q3/2025",               file:"bang-gia-Q3.xlsx",      dept:"Kinh doanh", audience:["Kinh doanh"],         status:"reviewing",  progress:40,  createdAt:"2025-05-19T14:30:00" },
  { id:"t3", name:"Module onboarding kỹ thuật v2",  file:"module-onboard-v2.pdf", dept:"Kỹ thuật",   audience:["Kỹ thuật"],           status:"approved",   progress:100, createdAt:"2025-05-18T10:00:00" },
  { id:"t4", name:"Chính sách bảo mật 2025",        file:"security-policy.pdf",   dept:"Chung",      audience:["all"],                status:"ai_trained", progress:100, createdAt:"2025-05-15T08:00:00" },
];

const INITIAL_LOGS = [
  { id:"l1", action:"Tải lên",         doc:"Chính sách bảo mật 2025",       user:"Nguyễn Admin", time:"2025-05-15T08:00:00", type:"upload" },
  { id:"l2", action:"Duyệt phát hành", doc:"Chính sách bảo mật 2025",       user:"Nguyễn Admin", time:"2025-05-15T09:30:00", type:"approve" },
  { id:"l3", action:"Cho AI học",      doc:"Chính sách bảo mật 2025",       user:"Nguyễn Admin", time:"2025-05-15T10:00:00", type:"ai" },
  { id:"l4", action:"Tải lên",         doc:"Module onboarding kỹ thuật v2", user:"Nguyễn Admin", time:"2025-05-18T10:00:00", type:"upload" },
  { id:"l5", action:"Duyệt phát hành", doc:"Module onboarding kỹ thuật v2", user:"Nguyễn Admin", time:"2025-05-18T11:00:00", type:"approve" },
];

const STATUS_CONFIG = {
  pending:    { label:"Chờ duyệt",    color:"warning", icon: Clock },
  reviewing:  { label:"Đang xem xét", color:"info",    icon: Eye },
  approved:   { label:"Đã duyệt",     color:"success", icon: CheckCircle2 },
  ai_trained: { label:"AI đã học",    color:"primary", icon: Bot },
  notified:   { label:"Đã nhắc học",  color:"success", icon: BellRing },
};

const LOG_CONFIG = {
  upload:  { color:"bg-blue-100 text-blue-600",   icon: Upload },
  approve: { color:"bg-green-100 text-green-600", icon: CheckCircle2 },
  ai:      { color:"bg-purple-100 text-purple-600", icon: Bot },
  notify:  { color:"bg-amber-100 text-amber-600", icon: Bell },
  delete:  { color:"bg-red-100 text-red-500",     icon: Trash2 },
};

const STATUS_FILTERS = ['Tất cả', 'Chờ duyệt', 'Đã duyệt', 'AI đã học'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getFileType = (filename) => {
  if (!filename) return 'Module';
  const ext = filename.split('.').pop().toLowerCase();
  if (['pdf','doc','docx'].includes(ext)) return 'PDF';
  if (['xlsx','xls','csv'].includes(ext)) return 'Excel';
  if (['mp4','mov','avi'].includes(ext)) return 'Video';
  return 'Module';
};

const FILE_ICON_MAP = { PDF: FileText, Excel: Table2, Video, Module: BookOpen };
const FILE_COLOR_MAP = {
  PDF:    'bg-red-50 text-red-500',
  Excel:  'bg-green-50 text-green-600',
  Video:  'bg-blue-50 text-blue-500',
  Module: 'bg-purple-50 text-purple-600',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function UpdatesPage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [logs, setLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vndc_logs')) || INITIAL_LOGS; }
    catch { return INITIAL_LOGS; }
  });

  const [dragOver, setDragOver] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Tất cả');

  useEffect(() => {
    api.getTasks()
      .then(data => setTasks(data.tasks || []))
      .catch(() => toast.error('Không thể tải danh sách tác vụ'))
      .finally(() => setLoading(false))
  }, []);

  useEffect(() => { localStorage.setItem('vndc_logs',  JSON.stringify(logs));  }, [logs]);


  // ─── Helpers ───────────────────────────────────────────────────────────────

  const addLog = (action, doc, type) => {
    setLogs(prev => [{
      id: 'l' + Date.now(), action, doc, type,
      user: user?.name || 'System',
      time: new Date().toISOString(),
    }, ...prev].slice(0, 50));
  };

  const updateTask = (id, updates) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleFiles = async (fileList) => {
    for (const file of Array.from(fileList)) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('name', file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '))
        formData.append('department', 'Chung')
        formData.append('audience', JSON.stringify(['all']))

        const token = JSON.parse(localStorage.getItem('vndc_user') || '{}')?.token
        const res = await fetch(
          `${API_URL}/api/updates`,
          {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + token },
            body: formData,
          }
        )
        if (!res.ok) throw new Error('Upload failed')
        const data = await res.json()
        setTasks(prev => [data.task, ...prev])
        addLog('Tải lên', data.task.name, 'upload')
        toast.success('Đã tải lên: ' + file.name)
      } catch (err) {
        toast.error('Lỗi upload: ' + err.message)
      }
    }
  };

  const handleApprove = async (id) => {
    try {
      const data = await api.approveTask(id)
      setTasks(prev => prev.map(t => t.id === id ? data.task : t))
      addLog('Duyệt phát hành', data.task.name, 'approve')
      toast.success('Đã duyệt: ' + data.task.name)
    } catch (err) {
      toast.error('Lỗi duyệt: ' + err.message)
    }
  };

  const handleAiTrain = async (id) => {
    const task = tasks.find(t => t.id === id)
    toast.info('AI đang xử lý tài liệu...')
    try {
      const data = await api.trainAI(id)
      setTasks(prev => prev.map(t => t.id === id ? data.task : t))
      addLog('Cho AI học', data.task.name, 'ai')
      toast.success('AI đã học xong: ' + data.task.name)
    } catch (err) {
      toast.error('Lỗi AI: ' + err.message)
    }
  };

  const handleNotify = async (id) => {
    try {
      const data = await api.notifyUsers(id)
      setTasks(prev => prev.map(t => t.id === id ? data.task : t))
      addLog('Gửi nhắc học', data.task.name, 'notify')
      toast.success(data.message || 'Đã gửi thông báo')
    } catch (err) {
      toast.error('Lỗi gửi nhắc: ' + err.message)
    }
  };

  const handleDelete = async (id) => {
    try {
      const task = tasks.find(t => t.id === id)
      await api.deleteTask(id)
      setTasks(prev => prev.filter(t => t.id !== id))
      addLog('Xoá tài liệu', task?.name || '', 'delete')
      toast.success('Đã xoá')
    } catch (err) {
      toast.error('Lỗi xoá: ' + err.message)
    }
  };

  // ─── Derived state ─────────────────────────────────────────────────────────

  const pendingCount  = tasks.filter(t => t.status === 'pending' || t.status === 'reviewing').length;
  const doneCount     = tasks.filter(t => t.status === 'ai_trained' || t.status === 'notified').length;

  const filteredTasks = tasks.filter(t => {
    if (statusFilter === 'Tất cả')   return true;
    if (statusFilter === 'Chờ duyệt') return t.status === 'pending' || t.status === 'reviewing';
    if (statusFilter === 'Đã duyệt') return t.status === 'approved';
    if (statusFilter === 'AI đã học') return t.status === 'ai_trained' || t.status === 'notified';
    return true;
  });

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) return <div className="p-8 text-center text-slate-400">Đang tải...</div>

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-6">

      {/* ── MAIN COLUMN ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Cập nhật tài liệu</h1>
          <p className="text-sm text-surface-500 font-medium mt-1">
            Quản lý vòng đời tài liệu — tải lên, duyệt, huấn luyện AI, thông báo
          </p>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <StatCard icon={Files} label="Tổng tasks" value={tasks.length} />
            <StatCard
              icon={Clock} label="Chờ duyệt" value={pendingCount}
              accent={pendingCount > 0 ? 'warning' : undefined}
            />
            <StatCard
              icon={CheckCircle2} label="Hoàn tất" value={doneCount}
              accent={doneCount > 0 ? 'success' : undefined}
            />
          </div>
        </div>

        {/* Upload zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          className={clsx(
            'rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200',
            dragOver
              ? 'border-primary-400 bg-primary-50 scale-[1.01] shadow-lg'
              : 'border-surface-200 bg-white hover:border-primary-300 hover:bg-surface-50'
          )}
        >
          <div className={clsx('flex justify-center', dragOver && 'animate-bounce')}>
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
              <Upload className="w-7 h-7 text-primary-500" />
            </div>
          </div>
          <p className="font-bold text-surface-900 text-base mt-4">Kéo thả tài liệu vào đây</p>
          <p className="text-sm text-surface-500 mt-1 font-medium">hoặc</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 px-5 py-2.5 bg-white border border-surface-200 rounded-xl text-sm font-semibold text-surface-700 hover:bg-surface-50 hover:border-surface-300 transition-colors shadow-sm"
          >
            {isAdmin ? 'Tải lên tài liệu (tự động duyệt)' : 'Đề xuất tài liệu mới (chờ Admin duyệt)'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
          />
          <p className="text-xs text-surface-400 font-medium mt-3">Hỗ trợ mọi định dạng · Tối đa 100MB/file</p>
        </div>

        {/* Task list */}
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-bold text-surface-900 text-lg">Danh sách tài liệu</h2>
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border',
                    statusFilter === f
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {filteredTasks.map(task => {
                const fileType = getFileType(task.file_name || '');
                const FIcon    = FILE_ICON_MAP[fileType] || FileText;
                const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusCfg.icon;

                const canApprove = !['approved','ai_trained','notified'].includes(task.status);
                const canAiTrain = task.status === 'approved';
                const canNotify  = task.status === 'ai_trained' || task.status === 'approved';

                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.22 }}
                    className="bg-white border border-surface-200 rounded-2xl p-5 shadow-sm"
                  >
                    {/* Row 1 — header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', FILE_COLOR_MAP[fileType])}>
                          <FIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-surface-900 line-clamp-1">{task.name}</p>
                          <p className="text-xs text-surface-400 font-medium mt-0.5">{task.file_name || ''}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge variant={statusCfg.color} className="flex items-center gap-1 whitespace-nowrap">
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </Badge>
                        <span className="text-[11px] text-surface-400 font-medium">{formatRelativeTime(task.createdAt)}</span>
                      </div>
                    </div>

                    {/* Row 2 — meta */}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-surface-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-surface-400" />
                        {task.dept}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-surface-400" />
                        {(task.audience || []).map(a => a === 'all' ? 'Toàn công ty' : a).join(', ')}
                      </div>
                    </div>

                    {/* Row 3 — progress */}
                    {(task.progress ?? 0) > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                          <span className="text-surface-500">Tiến độ xử lý</span>
                          <span className="text-surface-700">{task.progress ?? 0}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-100 rounded-full overflow-hidden">
                          <motion.div
                            className={clsx('h-full', (task.progress ?? 0) < 100 ? 'bg-primary-500' : 'bg-green-500')}
                            initial={{ width: '0%' }}
                            animate={{ width: `${task.progress ?? 0}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Row 4 — actions */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => canApprove && handleApprove(task.id)}
                        disabled={!canApprove}
                        title={!canApprove ? 'Tài liệu đã được duyệt' : 'Duyệt phát hành'}
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors border',
                          canApprove
                            ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'
                            : 'bg-surface-100 text-surface-400 border-surface-200 cursor-not-allowed'
                        )}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Duyệt phát hành
                      </button>

                      <button
                        onClick={() => canAiTrain && handleAiTrain(task.id)}
                        disabled={!canAiTrain}
                        title={!canAiTrain ? 'Cần duyệt phát hành trước' : 'Cho AI học tài liệu'}
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors border',
                          canAiTrain
                            ? 'bg-white text-surface-700 border-surface-200 hover:bg-surface-50'
                            : 'bg-surface-100 text-surface-400 border-surface-100 cursor-not-allowed'
                        )}
                      >
                        <Bot className="w-4 h-4" /> Cho AI học
                      </button>

                      <button
                        onClick={() => canNotify && handleNotify(task.id)}
                        disabled={!canNotify}
                        title={!canNotify ? 'Cần duyệt hoặc AI học trước' : 'Gửi nhắc học'}
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors border',
                          canNotify
                            ? 'bg-white text-surface-700 border-surface-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700'
                            : 'bg-surface-100 text-surface-400 border-surface-100 cursor-not-allowed'
                        )}
                      >
                        <BellRing className="w-4 h-4" /> Gửi nhắc học
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(task.id)}
                          title="Xoá tài liệu"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-red-500 border border-surface-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {filteredTasks.length === 0 && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-surface-200"
                >
                  <ClipboardList className="w-12 h-12 text-surface-300 mb-3" />
                  <p className="font-semibold text-surface-500">Không có tài liệu nào</p>
                  <p className="text-sm text-surface-400 font-medium mt-1">Thử đổi bộ lọc hoặc tải lên tài liệu mới</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── LOG SIDEBAR ── */}
      <div className="w-full lg:w-80 flex-shrink-0 bg-white border border-surface-200 rounded-2xl overflow-hidden lg:sticky lg:top-20 h-fit shadow-sm flex flex-col max-h-[85vh]">
        <div className="px-4 py-3 border-b border-surface-100 bg-surface-50 flex items-center justify-between">
          <h3 className="font-semibold text-surface-900">Nhật ký hoạt động</h3>
          <button
            onClick={() => { setLogs([]); toast.info('Đã xoá nhật ký'); }}
            className="text-xs font-semibold text-surface-500 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
          >
            Xoá tất cả
          </button>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-surface-50">
          <AnimatePresence initial={false}>
            {logs.length === 0 ? (
              <motion.div
                key="log-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <ClipboardList className="w-10 h-10 text-surface-300 mb-2" />
                <p className="text-sm text-surface-500 font-medium">Chưa có hoạt động</p>
              </motion.div>
            ) : (
              logs.map(log => {
                const cfg = LOG_CONFIG[log.type] || LOG_CONFIG.upload;
                const LogIcon = cfg.icon;
                return (
                  <motion.div
                    key={log.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-3 px-4 py-3"
                  >
                    <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5', cfg.color)}>
                      <LogIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-semibold text-sm text-surface-900 shrink-0">{log.action}</span>
                        <span className="text-sm text-surface-500 truncate">{log.doc}</span>
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-xs text-surface-400 font-medium">{log.user}</span>
                        <span className="text-xs text-surface-400 font-medium">{formatRelativeTime(log.time)}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── StatCard sub-component ──────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, accent }) {
  const colorMap = {
    warning: 'bg-amber-50 text-amber-600',
    success: 'bg-green-50 text-green-600',
  };
  const iconColor = accent ? colorMap[accent] : 'bg-primary-50 text-primary-600';
  const valueColor = accent === 'warning' ? 'text-amber-600' : accent === 'success' ? 'text-green-600' : 'text-surface-900';

  return (
    <div className="bg-white border border-surface-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconColor)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className={clsx('text-2xl font-extrabold', valueColor)}>{value}</div>
        <div className="text-xs text-surface-500 font-medium">{label}</div>
      </div>
    </div>
  );
}
