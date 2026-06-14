import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { api } from '@/utils/api';
import { Button, Badge } from '@/components/ui';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Rocket, HeartHandshake, TrendingUp, Wrench, Crown, Award, BookOpen } from 'lucide-react';

const ICON_MAP = {
  Rocket, HeartHandshake, TrendingUp, Wrench, Crown, Award, BookOpen
};

export default function ProgressPage() {
  const toast = useToast();

  const [modules, setModules] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, avgProgress: 0 });
  const [loading, setLoading] = useState(true);

  const loadProgress = async () => {
    try {
      const data = await api.getUserProgress();
      setModules(data.modules || []);
      setStats(data.stats || { total: 0, completed: 0, avgProgress: 0 });
    } catch (err) {
      toast.error('Không thể tải tiến độ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProgress(); }, []);

  const handleToggleComplete = async (mod) => {
    const newProgress = mod.progress === 100 ? 0 : 100;
    try {
      await api.updateProgress(mod.id, newProgress);
      await loadProgress();
      toast.success(newProgress === 100 ? '✅ Đánh dấu hoàn thành!' : 'Đã bỏ đánh dấu');
    } catch (err) {
      toast.error('Không thể cập nhật: ' + err.message);
    }
  };

  const { total: totalModules, completed: completedCount, avgProgress } = stats;

  let motivationalText = "Hãy bắt đầu hành trình học tập! 🚀";
  if (avgProgress > 0 && avgProgress <= 30) motivationalText = "Khởi đầu tuyệt vời! Hãy giữ vững phong độ nhé. 🌟";
  else if (avgProgress > 30 && avgProgress <= 70) motivationalText = "Bạn đang tiến bộ rất tốt! 💪";
  else if (avgProgress > 70 && avgProgress < 100) motivationalText = "Gần đến đích rồi! Cố lên! 🔥";
  else if (avgProgress === 100) motivationalText = "Xuất sắc! Bạn đã hoàn thành tất cả! 🎉";

  const hasStarted = completedCount >= 1;
  const hasSiengHoc = completedCount >= 3;
  const hasXuatSac = modules.some(m => m.quiz_score >= 90);
  const hasTocDo = false;
  const hasHoanHao = avgProgress === 100;

  if (loading) return (
    <div className="p-8 text-center text-slate-400">Đang tải tiến độ...</div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-8">
      {/* HEADER */}
      <div className="flex flex-col gap-2 mb-2">
        <h1 className="text-3xl font-extrabold text-surface-900">Tiến độ học tập</h1>
        <p className="text-surface-500 font-medium">Theo dõi quá trình học tập và thành tích của bạn</p>
      </div>

      <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100 shadow-sm">
        <p className="text-sm font-bold text-primary-700 uppercase tracking-wider mb-4">Tổng tiến độ</p>
        <div className="flex items-end justify-between mb-3">
          <div className="text-4xl font-extrabold text-primary-600">{avgProgress}%</div>
          <div className="text-surface-600 font-medium">{completedCount} / {totalModules} module hoàn thành</div>
        </div>
        <div className="h-4 w-full bg-primary-100/50 rounded-full overflow-hidden mb-4">
          <motion.div 
            className="h-full bg-primary-500"
            initial={{ width: "0%" }}
            animate={{ width: `${avgProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="text-sm font-medium text-surface-700">{motivationalText}</p>
      </div>

      {/* MODULE LIST */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-surface-900 mt-2">Chi tiết module</h2>
        {modules.map(m => {
          const ModIcon = ICON_MAP[m.icon] || BookOpen;
          let levelColor = 'bg-primary-400 text-white';
          let badgeColor = 'success';
          
          if (m.level === 'Trung cấp') { levelColor = 'bg-blue-400 text-white'; badgeColor = 'info'; }
          else if (m.level === 'Nâng cao') { levelColor = 'bg-orange-400 text-white'; badgeColor = 'warning'; }
          else if (m.level === 'Chuyên gia') { levelColor = 'bg-purple-400 text-white'; badgeColor = 'primary'; }

          return (
            <div key={m.id} className="bg-white border border-surface-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", levelColor)}>
                  <ModIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-surface-900 truncate text-sm">{m.title}</h3>
                    <Badge variant={badgeColor} className="text-[10px] shrink-0">{m.level}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 bg-surface-100 rounded-full overflow-hidden">
                      <motion.div 
                        className={clsx("h-full", m.progress === 100 ? "bg-green-500" : "bg-primary-500")}
                        initial={{ width: "0%" }}
                        animate={{ width: `${m.progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-surface-600 w-8">{m.progress}%</span>
                    <span className="hidden sm:inline text-xs text-surface-400 shrink-0">· {m.estimated_hours} giờ</span>
                  </div>
                </div>
              </div>
              <div className="shrink-0 flex justify-end">
                {m.locked ? (
                  <Badge variant="default" className="bg-surface-100 text-surface-500">🔒 Khoá</Badge>
                ) : m.progress === 100 ? (
                  <Button variant="ghost" size="sm" className="bg-green-50 text-green-700 hover:bg-green-100 w-full sm:w-auto" onClick={() => handleToggleComplete(m)}>
                    ✓ Hoàn thành
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={() => handleToggleComplete(m)}>
                    Đánh dấu hoàn thành
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ACHIEVEMENTS SECTION */}
      <div className="flex flex-col gap-4 pt-4 border-t border-surface-200">
        <h2 className="text-lg font-bold text-surface-900">Thành tích</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <AchievementBadge title="Bắt đầu" desc="Hoàn thành 1 module" emoji="🎯" earned={hasStarted} />
          <AchievementBadge title="Siêng học" desc="Hoàn thành 3 module" emoji="📚" earned={hasSiengHoc} />
          <AchievementBadge title="Xuất sắc" desc="Quiz score ≥ 90" emoji="🏆" earned={hasXuatSac} />
          <AchievementBadge title="Tốc độ" desc="Xong trong 1 ngày" emoji="⚡" earned={hasTocDo} />
          <AchievementBadge title="Hoàn hảo" desc="Tất cả module 100%" emoji="🌟" earned={hasHoanHao} />
        </div>
      </div>
    </div>
  );
}

function AchievementBadge({ title, desc, emoji, earned }) {
  return (
    <div className={clsx(
      "rounded-2xl border p-4 text-center flex flex-col items-center justify-center gap-2 transition-all",
      earned ? "bg-primary-50 border-primary-200" : "bg-surface-50 border-surface-200 grayscale opacity-50"
    )}>
      <div className="text-3xl">{emoji}</div>
      <div>
        <p className={clsx("font-bold text-sm", earned ? "text-surface-900" : "text-surface-500")}>{title}</p>
        <p className={clsx("text-xs font-medium mt-0.5", earned ? "text-surface-600" : "text-surface-400")}>{desc}</p>
      </div>
    </div>
  )
}
