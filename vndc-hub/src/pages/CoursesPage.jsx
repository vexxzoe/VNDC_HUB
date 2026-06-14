import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLearning } from '@/context/LearningContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/utils/api';
import { getAssignedModules, getFilteredDocs, normalizeDept } from '@/utils/permissions';
import { Badge, Button } from '@/components/ui';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { BookOpen, Video, Clock, Lock, FileText, Table2, Rocket, HeartHandshake, TrendingUp, Wrench, Crown, Award } from 'lucide-react';

const ICON_MAP = {
  FileText, Table2, Video, BookOpen, Rocket, HeartHandshake, TrendingUp, Wrench, Crown, Award
};

const containerVariant = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};

const itemVariant = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function CoursesPage() {
  const { user, isAdmin } = useAuth();
  const { modules, updateProgress } = useLearning();
  const navigate = useNavigate();
  const toast = useToast();

  const [selectedDept, setSelectedDept] = useState('Tất cả');
  const [docsData, setDocsData] = useState([]);

  useEffect(() => {
    api.getDocuments()
      .then(data => setDocsData(data.documents || []))
      .catch(err => console.error('Load docs error:', err))
  }, []);

  const assignedModules = getAssignedModules(modules, user);
  const completedCount = assignedModules.filter(m => m.progress === 100).length;
  
  const totalHours = assignedModules.reduce((s, m) => s + m.estimatedHours, 0);
  const completedHours = assignedModules.reduce((s, m) => s + (m.progress === 100 ? m.estimatedHours : 0), 0);
  const completedTotal = assignedModules.filter(m => m.progress === 100).length;
  
  const quizzes = assignedModules.filter(m => m.quizScore !== null);
  const avgQuiz = quizzes.length > 0 ? Math.round(quizzes.reduce((s, m) => s + m.quizScore, 0) / quizzes.length) : 0;

  const depts = ['Tất cả', ...new Set(modules.map(m => normalizeDept(m.department)).flat().filter(d => d !== 'all'))];

  const displayModules = assignedModules.filter(m => {
    const d = normalizeDept(m.department);
    return selectedDept === 'Tất cả' || d.includes(selectedDept) || d.includes('all');
  });

  const assignedDocs = getFilteredDocs(docsData || [], user, 'all', 'all').slice(0, 4);

  const handleCTA = async (m) => {
    if (m.locked) return;
    const newProgress = Math.min((parseInt(m.progress) || 0) + 20, 100);
    try {
      await api.updateProgress(m.id, newProgress);
    } catch { /* ignore */ }
    updateProgress(m.id, newProgress);
    toast.info(`Tiến độ: ${newProgress}%`);
  };



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      {/* HERO BANNER */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-primary-700 to-primary-500 text-white p-8 shadow-card">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/4 pointer-events-none" />
        <div className="absolute bottom-0 right-32 w-48 h-48 bg-white/5 rounded-full blur-2xl transform translate-y-1/4 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1 space-y-4">
            <p className="text-white/70 uppercase tracking-wider text-xs font-bold">Lộ trình đào tạo</p>
            <h1 className="text-3xl font-extrabold text-white">Phòng ban {user?.department || 'VNDC'}</h1>
            <p className="text-white/80 font-medium">
              {assignedModules.length} module được giao · {completedCount} module hoàn thành
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="px-3 py-1.5 rounded-full bg-white/10 text-sm font-medium border border-white/20 backdrop-blur-md">📚 {(assignedDocs || []).length} Tài liệu</div>
              <div className="px-3 py-1.5 rounded-full bg-white/10 text-sm font-medium border border-white/20 backdrop-blur-md">🎥 {assignedModules.reduce((s,m)=>s+m.videos, 0)} Video</div>
              <div className="px-3 py-1.5 rounded-full bg-white/10 text-sm font-medium border border-white/20 backdrop-blur-md">✅ {completedCount} Hoàn thành</div>
            </div>
          </div>
          
          <div className="hidden md:flex flex-col gap-3 shrink-0">
            <div className="px-5 py-2.5 rounded-full bg-white/20 border border-white/10 backdrop-blur-md text-sm font-medium flex justify-between min-w-[200px]">
              <span className="text-white/80">Tổng giờ học</span>
              <span className="font-bold">{totalHours}h</span>
            </div>
            <div className="px-5 py-2.5 rounded-full bg-white/20 border border-white/10 backdrop-blur-md text-sm font-medium flex justify-between min-w-[200px]">
              <span className="text-white/80">Đã hoàn thành</span>
              <span className="font-bold">{completedTotal}/{assignedModules.length}</span>
            </div>
            <div className="px-5 py-2.5 rounded-full bg-white/20 border border-white/10 backdrop-blur-md text-sm font-medium flex justify-between min-w-[200px]">
              <span className="text-white/80">Điểm Quiz TB</span>
              <span className="font-bold">{avgQuiz}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DEPT FILTER */}
      {isAdmin && (
        <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-2">
          {depts.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={clsx(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors border",
                selectedDept === dept
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-surface-600 border-surface-200 hover:bg-surface-50"
              )}
            >
              {dept}
            </button>
          ))}
        </div>
      )}

      {/* MODULES GRID */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        variants={containerVariant}
        initial="hidden"
        animate="show"
      >
        {displayModules.map((m, index) => {
          const ModIcon = ICON_MAP[m.icon] || BookOpen;
          
          let levelColor = 'bg-primary-400';
          let badgeColor = 'success';
          let iconBg = 'bg-primary-50 text-primary-600';
          
          if (m.level === 'Trung cấp') { levelColor = 'bg-blue-400'; badgeColor = 'info'; iconBg = 'bg-blue-50 text-blue-600'; }
          else if (m.level === 'Nâng cao') { levelColor = 'bg-orange-400'; badgeColor = 'warning'; iconBg = 'bg-orange-50 text-orange-600'; }
          else if (m.level === 'Chuyên gia') { levelColor = 'bg-purple-400'; badgeColor = 'primary'; iconBg = 'bg-purple-50 text-purple-600'; }

          return (
            <motion.div key={m.id} variants={itemVariant} className="relative bg-white rounded-2xl border border-surface-200 shadow-card flex flex-col overflow-hidden">
              <div className={clsx("h-1.5 w-full", levelColor)} />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start">
                  <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
                    <ModIcon className="w-6 h-6" />
                  </div>
                  <Badge variant={badgeColor}>{m.level}</Badge>
                </div>
                
                <h3 className="font-bold text-lg text-surface-900 mt-3 line-clamp-2 min-h-[56px]">{m.title}</h3>
                
                <div className="flex gap-4 text-sm text-surface-500 font-medium mt-2">
                  <div className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {m.lessons} bài học</div>
                  <div className="flex items-center gap-1.5"><Video className="w-4 h-4" /> {m.videos} video</div>
                  <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {m.estimatedHours} giờ</div>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-surface-600">Tiến độ</span>
                    <span className={m.progress > 0 ? "text-primary-600" : "text-surface-400"}>{m.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-100 rounded-full overflow-hidden">
                    <motion.div 
                      className={clsx("h-full", m.progress === 100 ? "bg-green-500" : "bg-primary-500")}
                      initial={{ width: "0%" }}
                      animate={{ width: `${m.progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                    />
                  </div>
                  
                  <div className="min-h-[32px] mt-2 flex flex-wrap gap-2">
                    {m.progress === 100 && <Badge variant="success" className="text-[10px]">✓ Hoàn thành</Badge>}
                    {m.quizScore !== null && <Badge variant="warning" className="text-[10px]">Quiz: {m.quizScore} điểm</Badge>}
                  </div>
                </div>

                <div className="mt-auto pt-4 relative z-20">
                  {m.locked ? (
                    <Button disabled className="w-full justify-center text-surface-500 bg-surface-100 opacity-100 border-none relative z-20">
                      🔒 Chưa mở khoá
                    </Button>
                  ) : m.progress === 0 ? (
                    <Button variant="primary" className="w-full justify-center relative z-20" onClick={() => handleCTA(m)}>Bắt đầu học</Button>
                  ) : m.progress < 100 ? (
                    <Button variant="secondary" className="w-full justify-center relative z-20" onClick={() => handleCTA(m)}>Tiếp tục</Button>
                  ) : (
                    <Button variant="ghost" className="w-full justify-center text-green-600 bg-green-50 hover:bg-green-100 border-none relative z-20" onClick={() => handleCTA(m)}>Xem lại</Button>
                  )}
                </div>
              </div>
              
              {m.locked && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center">
                  <div className="w-14 h-14 bg-surface-100 rounded-full flex items-center justify-center text-surface-400 shadow-sm mb-3">
                    <Lock className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-surface-700">Chưa mở khoá</p>
                  <p className="text-xs text-surface-500 mt-1 max-w-[200px] text-center font-medium">Hoàn thành module trước để mở khoá</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* ASSIGNED DOCS SECTION */}
      <div className="border-t border-surface-200 pt-8 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-surface-900">Tài liệu học tập được giao</h2>
          <Badge variant="primary">{(assignedDocs || []).length}</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(assignedDocs || []).map(doc => {
            const DocIcon = ICON_MAP[doc.icon] || FileText;
            return (
              <div key={doc.id} className="flex items-center gap-3 bg-white border border-surface-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  doc.type === 'PDF' ? 'bg-red-50 text-red-500' :
                  doc.type === 'Excel' ? 'bg-green-50 text-green-600' :
                  doc.type === 'Video' ? 'bg-blue-50 text-blue-500' :
                  'bg-purple-50 text-purple-500'
                )}>
                  <DocIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-surface-900 line-clamp-1">{doc.name}</p>
                  <Badge variant="outline" className="mt-1 text-[10px]">{doc.type}</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  toast.info("Đang chuyển tới thư viện...");
                  navigate('/library');
                }}>Xem</Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
