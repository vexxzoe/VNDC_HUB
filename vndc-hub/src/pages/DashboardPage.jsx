import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DOCUMENTS, MODULES, NOTIFICATIONS } from '@/data/mockData';
import { api } from '@/utils/api';
import { getAssignedModules } from '@/utils/permissions';
import { formatRelativeTime } from '@/utils/formatTime';
import { Card, Badge, Avatar, Button } from '@/components/ui';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { useCountUp } from '@/hooks/useCountUp';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { 
  FileText, PlayCircle, ClipboardCheck, Award, 
  Rocket, HeartHandshake, TrendingUp, Wrench, Crown, 
  Table2, Video, BookOpen, ShieldCheck, Upload, Brain, Users, Bell, ClipboardList, Unlock
} from 'lucide-react';



const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng,';
  if (hour < 18) return 'Chào buổi chiều,';
  return 'Chào buổi tối,';
};

const containerVariant = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
};

const itemVariant = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const ICON_MAP = {
  FileText, Table2, Video, BookOpen, ClipboardList, ShieldCheck, Rocket, HeartHandshake, TrendingUp, Wrench, Crown, Award, Unlock
};

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [apiModules, setApiModules] = useState([]);
  const [apiDocs, setApiDocs] = useState([]);
  const [apiNotifications, setApiNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [progressData, docsData, notifsData] = await Promise.all([
          api.getUserProgress(),
          api.getDocuments(),
          api.getNotifications(),
        ]);
        if (cancelled) return;
        setApiModules(progressData.modules || []);
        setApiDocs((docsData.documents || []).slice(0, 5));
        setApiNotifications(notifsData.notifications || []);
      } catch {
        if (cancelled) return;
        // Fallback to mockData
        setApiModules(MODULES);
        setApiDocs(DOCUMENTS.slice(0, 5));
        setApiNotifications(NOTIFICATIONS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  const modules = apiModules.length ? apiModules : MODULES;
  const recentDocs = apiDocs.length ? apiDocs : [...DOCUMENTS].sort((a,b) => b.updatedAt?.localeCompare(a.updatedAt)).slice(0,5);
  const notifications = apiNotifications.length ? apiNotifications : NOTIFICATIONS;

  const assignedModules = getAssignedModules(modules, user);
  const avgProgress = assignedModules.length 
    ? Math.round(assignedModules.reduce((acc, m) => acc + (parseInt(m.progress) || 0), 0) / assignedModules.length) 
    : 0;

  const unreadNotifs = notifications.filter(n => !n.is_read && !n.read).length;

  const docCount = useCountUp(loading ? 0 : (modules.length || 15), 1000);
  const videoCount = useCountUp(loading ? 0 : (modules.filter(m => m.videos > 0).length || 4), 1000);
  const assignedCount = useCountUp(loading ? 0 : assignedModules.length, 1000);
  const completedCount = useCountUp(loading ? 0 : assignedModules.filter(m => parseInt(m.progress) === 100).length, 1000);

  const topModules = assignedModules.filter(m => !m.locked).slice(0, 3);

  const today = new Date();
  const dateStr = today.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  return loading ? <PageSkeleton /> : (
    <motion.div 
      className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8"
      variants={containerVariant}
      initial="hidden"
      animate="show"
    >
      {/* SECTION 1: Welcome Hero */}
      <motion.div variants={itemVariant}>
        <div className="w-full flex justify-between items-center rounded-2xl bg-gradient-to-r from-primary-50 to-white border border-primary-100 p-8 shadow-sm dark:from-primary-900/20 dark:to-surface-800 dark:border-primary-900/30">
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-surface-500 font-medium">{getGreeting()}</p>
              <h1 className="text-3xl font-extrabold text-surface-900 mt-1">{user?.name} 👋</h1>
            </div>
            <div className="flex gap-2 items-center">
              <Badge variant="outline">{user?.department || 'VNDC'}</Badge>
              <Badge variant={isAdmin ? 'primary' : 'default'} className="uppercase text-[10px]">{user?.role || 'Guest'}</Badge>
            </div>
            <p className="text-sm text-surface-500">Hôm nay là {dateStr}</p>
            <div className="flex gap-3 pt-2">
              <Button onClick={() => navigate('/courses')}>Tiếp tục học</Button>
              <Button variant="secondary" onClick={() => navigate('/library')}>Xem tài liệu</Button>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-center justify-center shrink-0 pr-8">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle cx="56" cy="56" r="50" fill="transparent" stroke="var(--color-border)" strokeWidth="8" />
                <motion.circle
                  cx="56" cy="56" r="50" fill="transparent"
                  stroke="var(--color-primary)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 50}
                  initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - avgProgress / 100) }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-surface-900">{avgProgress}%</span>
              </div>
            </div>
            <p className="text-xs text-surface-500 font-medium mt-2">Tiến độ học</p>
          </div>
        </div>
      </motion.div>

      {/* SECTION 2: Stats Row */}
      <motion.div variants={itemVariant} className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <Card className="flex flex-col gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-surface-900">{docCount}</div>
            <div className="text-sm text-surface-500 font-medium">Tài liệu</div>
            <div className="text-xs text-primary-600 font-medium mt-1">↑ 2 tuần này</div>
          </div>
        </Card>
        <Card className="flex flex-col gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <PlayCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-surface-900">{videoCount}</div>
            <div className="text-sm text-surface-500 font-medium">Video đào tạo</div>
            <div className="text-xs text-primary-600 font-medium mt-1">Mới nhất hôm nay</div>
          </div>
        </Card>
        <Card className="flex flex-col gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-surface-900">{assignedCount}</div>
            <div className="text-sm text-surface-500 font-medium">Module được giao</div>
            <div className="text-xs text-surface-400 font-medium mt-1">&nbsp;</div>
          </div>
        </Card>
        <Card className="flex flex-col gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-surface-900">{completedCount}</div>
            <div className="text-sm text-surface-500 font-medium">Hoàn thành</div>
            <div className="text-xs text-green-600 font-medium mt-1">🎉 Tiếp tục phát huy</div>
          </div>
        </Card>
      </motion.div>

      {/* SECTION 3: Main grid */}
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
        
        {/* Left col */}
        <div className="flex-1 flex flex-col gap-6 sm:gap-8 min-w-0">
          <motion.div variants={itemVariant}>
            <Card padding="none" className="overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-surface-100">
                <h2 className="font-bold text-surface-900 text-lg">Lộ trình học của bạn</h2>
                <button 
                  onClick={() => navigate('/courses')}
                  className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Xem tất cả
                </button>
              </div>
              <div className="p-6 space-y-4">
                {topModules.length === 0 ? (
                  <p className="text-surface-500 text-sm text-center py-4">Chưa có module nào được giao.</p>
                ) : (
                  topModules.map(m => {
                    const ModIcon = ICON_MAP[m.icon] || BookOpen;
                    let levelBadge = 'default';
                    if (m.level === 'Cơ bản') levelBadge = 'success';
                    if (m.level === 'Trung cấp') levelBadge = 'info';
                    if (m.level === 'Nâng cao') levelBadge = 'warning';
                    
                    return (
                      <div key={m.id} className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                          <ModIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-surface-900 truncate">{m.title}</h3>
                            <Badge variant={levelBadge} className="shrink-0 text-[10px]">{m.level}</Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-primary-500"
                                initial={{ width: "0%" }}
                                animate={{ width: `${m.progress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-surface-600 w-8 text-right">{m.progress}%</span>
                          </div>
                        </div>
                        {m.progress === 100 && (
                          <Badge variant="success" className="hidden sm:inline-flex shrink-0 text-[10px]">Hoàn thành</Badge>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariant}>
            <Card padding="none" className="overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-surface-100">
                <h2 className="font-bold text-surface-900 text-lg">Tài liệu gần đây</h2>
                <button 
                  onClick={() => navigate('/library')}
                  className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Xem thư viện
                </button>
              </div>
              <div className="divide-y divide-surface-100">
                {recentDocs.map(doc => {
                  const DocIcon = ICON_MAP[doc.icon] || FileText;
                  let iconColor = 'text-surface-500';
                  if (doc.type === 'PDF') iconColor = 'text-red-500';
                  if (doc.type === 'Excel') iconColor = 'text-green-600';
                  if (doc.type === 'Video') iconColor = 'text-blue-500';
                  if (doc.type === 'Module') iconColor = 'text-purple-500';

                  return (
                    <div key={doc.id} className="flex items-center gap-3 sm:gap-4 p-4 sm:px-6 hover:bg-surface-50 transition-colors">
                      <DocIcon className={clsx("w-6 h-6 shrink-0", iconColor)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-surface-900 truncate">{doc.name}</p>
                          <Badge variant="default" className="hidden sm:inline-flex shrink-0 text-[10px]">{doc.department}</Badge>
                        </div>
                        <p className="text-xs text-surface-500 mt-0.5">{formatRelativeTime(doc.updatedAt)}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/library')} className="shrink-0">
                        Xem
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Right col */}
        <div className="hidden lg:flex flex-col gap-8 w-80 shrink-0">
          <motion.div variants={itemVariant}>
            <Card padding="none" className="overflow-hidden">
              <div className="flex items-center gap-2 p-6 border-b border-surface-100">
                <h2 className="font-bold text-surface-900 text-lg">Thông báo</h2>
                {unreadNotifs > 0 && <Badge variant="danger" className="px-1.5 py-0 h-5">{unreadNotifs}</Badge>}
              </div>
              <div className="flex flex-col">
                {notifications.map(n => {
                  const NIcon = ICON_MAP[n.icon] || Bell;
                  return (
                    <div 
                      key={n.id} 
                      className={clsx(
                        "flex gap-3 p-4 border-b border-surface-50 last:border-0",
                        (!n.is_read && !n.read) && "bg-primary-50/30 border-l-2 border-l-primary-500"
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                        <NIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={clsx("text-sm", (!n.is_read && !n.read) ? "font-semibold text-surface-900" : "font-medium text-surface-700")}>
                          {n.text}
                        </p>
                        <p className="text-xs text-surface-500 mt-1">{n.time || n.created_at}</p>
                      </div>
                    </div>
                  )
                })}
                <button className="text-sm font-semibold text-surface-500 hover:text-surface-700 p-4 transition-colors">
                  Xem tất cả
                </button>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariant}>
            <Card>
              <h2 className="font-bold text-surface-900 text-lg mb-4">Truy cập nhanh</h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => navigate('/updates')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl hover:bg-primary-50 transition-colors group">
                  <Upload className="w-6 h-6 text-primary-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-surface-600">Upload tài liệu</span>
                </button>
                <button onClick={() => navigate('/quiz')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl hover:bg-primary-50 transition-colors group">
                  <Brain className="w-6 h-6 text-primary-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-surface-600">Làm Quiz</span>
                </button>
                <button onClick={() => navigate('/videos')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl hover:bg-primary-50 transition-colors group">
                  <PlayCircle className="w-6 h-6 text-primary-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-surface-600">Xem Video</span>
                </button>
                {isAdmin && (
                  <button onClick={() => navigate('/people')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl hover:bg-primary-50 transition-colors group">
                    <Users className="w-6 h-6 text-primary-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium text-surface-600">Nhân viên</span>
                  </button>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
