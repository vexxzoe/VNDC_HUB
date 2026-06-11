import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLearning } from '@/context/LearningContext';
import { useToast } from '@/context/ToastContext';
import { getAssignedModules } from '@/utils/permissions';
import { api } from '@/utils/api';
import { Modal } from '@/components/ui/Modal';
import { Badge, Button } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  ClipboardList, CheckCircle2, Award, ArrowLeft, Clock,
  XCircle, Download, Rocket, HeartHandshake, TrendingUp,
  Wrench, Crown, BookOpen
} from 'lucide-react';

// ─── Icon / colour maps (reused from CoursesPage) ────────────────────────────
const ICON_MAP = { Rocket, HeartHandshake, TrendingUp, Wrench, Crown, Award, BookOpen };

const LEVEL_BAR   = { 'Cơ bản':'bg-primary-400', 'Trung cấp':'bg-blue-400', 'Nâng cao':'bg-orange-400', 'Chuyên gia':'bg-purple-400' };
const LEVEL_BADGE = { 'Cơ bản':'success', 'Trung cấp':'info', 'Nâng cao':'warning', 'Chuyên gia':'primary' };
const LEVEL_ICON  = { 'Cơ bản':'bg-primary-50 text-primary-600', 'Trung cấp':'bg-blue-50 text-blue-600', 'Nâng cao':'bg-orange-50 text-orange-600', 'Chuyên gia':'bg-purple-50 text-purple-600' };

// ─── Small stat card ─────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent }) {
  const bg  = accent === 'success' ? 'bg-green-50 text-green-600' : accent === 'primary' ? 'bg-primary-50 text-primary-600' : 'bg-surface-100 text-surface-500';
  const val = accent === 'success' ? 'text-green-600' : accent === 'primary' ? 'text-primary-600' : 'text-surface-900';
  return (
    <div className="bg-white border border-surface-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className={clsx('text-2xl font-extrabold', val)}>{value}</div>
        <div className="text-xs text-surface-500 font-medium">{label}</div>
      </div>
    </div>
  );
}

// ─── Animated SVG arc ────────────────────────────────────────────────────────
function ScoreArc({ score }) {
  const r = 54; const circ = 2 * Math.PI * r;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#f87171';
  return (
    <svg width="140" height="140" className="mx-auto">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10"/>
      <motion.circle
        cx="70" cy="70" r={r} fill="none"
        stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - score / 100) }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '70px 70px' }}
      />
      <text x="70" y="66" textAnchor="middle" fontSize="28" fontWeight="700" fill="#0f172a">{score}</text>
      <text x="70" y="86" textAnchor="middle" fontSize="13" fill="#94a3b8">/100</text>
    </svg>
  );
}

// ─── Timer circle ─────────────────────────────────────────────────────────────
function TimerCircle({ timeLeft }) {
  const r = 20; const circ = 126;
  const color = timeLeft > 30 ? 'var(--color-primary)' : timeLeft > 10 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg width="56" height="56" className="absolute inset-0">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4"/>
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - timeLeft / 60)}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '28px 28px', transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <span className="relative z-10 text-sm font-bold" style={{ color }}>{timeLeft}s</span>
    </div>
  );
}

// ─── Certificate Modal ────────────────────────────────────────────────────────
function CertModal({ open, onClose, user, module, score }) {
  const toast = useToast();
  if (!module) return null;
  const today = new Date().toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="text-center">
        <div className="border-2 border-primary-200 rounded-2xl p-6">
          <div className="border border-primary-100 rounded-xl p-6">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto">
              <Award className="w-8 h-8 text-primary-500" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary-600 mt-4">Chứng nhận hoàn thành</p>
            <div className="h-px bg-primary-100 my-4" />
            <p className="text-sm text-surface-500 mt-2">Chứng nhận rằng</p>
            <p className="text-2xl font-bold text-primary-800 mt-1 italic">{user?.name}</p>
            <p className="text-sm text-surface-500 mt-3">đã hoàn thành xuất sắc</p>
            <p className="text-xl font-bold text-surface-900 mt-1">{module.title}</p>
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full border border-primary-200">
              <span className="text-sm font-bold text-primary-700">Điểm: {score}/100</span>
            </div>
            <div className="h-px bg-primary-100 my-6" />
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div><p className="text-xs text-surface-400 mb-1">Ngày cấp</p><p className="font-bold text-surface-800">{today}</p></div>
              <div><p className="text-xs text-surface-400 mb-1">Đơn vị</p><p className="font-bold text-surface-800">VNDC HUB</p><p className="text-xs text-surface-500">Đào tạo nội bộ</p></div>
              <div><p className="text-xs text-surface-400 mb-1">Xác nhận</p><Award className="w-6 h-6 text-primary-400 mx-auto"/></div>
            </div>
            <p className="text-xs text-surface-400 italic mt-4">Chứng nhận này được cấp bởi hệ thống VNDC HUB</p>
          </div>
        </div>
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="primary" icon={Download} onClick={() => toast.info('Tính năng xuất PDF sẽ có ở phiên bản tiếp theo')}>Tải chứng nhận</Button>
          <Button variant="secondary" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function QuizPage() {
  const { user } = useAuth();
  const { updateProgress, updateQuizScore } = useLearning();
  const toast = useToast();

  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);

  useEffect(() => {
    api.getModules()
      .then(data => setModules(data.modules || []))
      .catch(() => toast.error('Không thể tải danh sách module'))
      .finally(() => setLoadingModules(false))
  }, []);

  const [phase, setPhase]               = useState('select');
  const [selectedModule, setSelectedModule] = useState(null);
  const [currentQ, setCurrentQ]         = useState(0);
  const [answers, setAnswers]           = useState({});
  const [showCert, setShowCert]         = useState(false);
  const [timeLeft, setTimeLeft]         = useState(60);
  const [resultData, setResultData]     = useState(null); // { score, correct, total }

  const [questions, setQuestions] = useState([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState('');

  const timerRef = useRef(null);



  // countdown timer
  useEffect(() => {
    if (phase !== 'quiz') { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, currentQ]);

  const total = questions.length;

  const handleTimeUp = useCallback(() => {
    setAnswers(prev => {
      const updated = { ...prev };
      if (updated[currentQ] === undefined) updated[currentQ] = -1;
      return updated;
    });
    setCurrentQ(prev => {
      if (prev >= total - 1) { submitQuiz(); return prev; }
      setTimeLeft(60);
      return prev + 1;
    });
  }, [currentQ, total]);

  const startQuiz = async (module) => {
    setQuizError('')
    setLoadingQuiz(true)
    try {
      const data = await api.getQuiz(module.id)
      if (!data.questions || data.questions.length === 0) {
        setQuizError('Module này chưa có câu hỏi quiz')
        setLoadingQuiz(false)
        return
      }
      setQuestions(data.questions)
      setSelectedModule(module)
      setCurrentQ(0)
      setAnswers({})
      setTimeLeft(60)
      setPhase('quiz')
    } catch (err) {
      if (err.message?.includes('chưa có quiz') ||
          err.message?.includes('không tồn tại')) {
        setQuizError('Module này chưa có câu hỏi quiz')
      } else {
        toast.error('Không thể tải quiz: ' + err.message)
      }
    } finally {
      setLoadingQuiz(false)
    }
  };

  const submitQuiz = async () => {
    clearInterval(timerRef.current);
    const answersById = {}
    questions.forEach((q, index) => {
      if (answers[index] !== undefined) {
        answersById[q.id] = answers[index]
      }
    })

    try {
      const result = await api.submitQuiz(selectedModule.id, answersById)
      setResultData({
        score: result.score,
        correct: result.correct,
        total: questions.length,
        passed: result.passed,
        certificate: result.certificate || null
      })
      updateQuizScore(selectedModule.id, result.score);
      if (result.passed) updateProgress(selectedModule.id, 100);
      setPhase('result')
    } catch (err) {
      toast.error('Lỗi nộp bài: ' + err.message)
    }
  };

  const assignedModules = getAssignedModules(modules, user);
  const doneCount = assignedModules.filter(m => m.quizScore !== null).length;
  const quizScores = assignedModules.filter(m => m.quizScore !== null).map(m => m.quizScore);
  const avgScore = quizScores.length ? Math.round(quizScores.reduce((a,b)=>a+b,0)/quizScores.length) : null;

  // ── PHASE: SELECT ──────────────────────────────────────────────────────────
  if (loadingModules) return (
    <div className="p-8 text-center text-slate-400">
      Đang tải modules...
    </div>
  )

  if (phase === 'select') return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-surface-900">Quiz & Chứng nhận</h1>
      <p className="text-sm text-surface-500 font-medium mt-1">Kiểm tra kiến thức và nhận chứng nhận hoàn thành</p>

      <div className="grid grid-cols-3 gap-3 mt-5 mb-8">
        <StatCard icon={ClipboardList} label="Modules" value={assignedModules.length} />
        <StatCard icon={CheckCircle2} label="Đã làm" value={doneCount} accent="success" />
        <StatCard icon={Award} label="Điểm TB" value={avgScore !== null ? avgScore : '—'} accent="primary" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {assignedModules.map(mod => {
          const ModIcon = ICON_MAP[mod.icon] || BookOpen;
          const scored  = mod.quizScore !== null;
          const passed  = scored && mod.quizScore >= 80;

          return (
            <div key={mod.id} className="bg-white border border-surface-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className={clsx('h-1.5 w-full', LEVEL_BAR[mod.level] || 'bg-surface-200')} />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start">
                  <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', LEVEL_ICON[mod.level])}>
                    <ModIcon className="w-6 h-6" />
                  </div>
                  <Badge variant={LEVEL_BADGE[mod.level]}>{mod.level}</Badge>
                </div>
                <h3 className="font-bold text-lg text-surface-900 mt-3">{mod.title}</h3>

                <div className="mt-3 flex-1">
                  {scored ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-primary-600">{mod.quizScore}</span>
                        <span className="text-surface-400 font-medium">/100</span>
                      </div>
                      <Badge variant={passed ? 'success' : 'warning'} className="w-fit">
                        {passed ? '✓ Đạt' : 'Chưa đạt'}
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-surface-500 font-medium">Sẵn sàng kiểm tra</p>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => startQuiz(mod)}
                    disabled={loadingQuiz}
                    className={clsx(
                      'w-full py-2.5 rounded-xl text-sm font-semibold transition-colors',
                      scored
                        ? 'bg-white border border-surface-200 text-surface-700 hover:bg-surface-50'
                        : 'bg-primary-600 text-white hover:bg-primary-700',
                      loadingQuiz && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {loadingQuiz && selectedModule?.id === mod.id ? 'Đang tải...' : (scored ? 'Làm lại quiz' : 'Bắt đầu quiz')}
                  </button>
                  {quizError && selectedModule?.id === mod.id && (
                    <p className="text-sm text-red-500 mt-2 text-center">{quizError}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── PHASE: QUIZ ────────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const q = questions[currentQ];
    const answered = answers[currentQ] !== undefined;
    const allAnswered = Object.keys(answers).length >= total;

    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { if (window.confirm('Bỏ quiz? Tiến độ sẽ mất.')) { clearInterval(timerRef.current); setPhase('select'); }}}
            className="flex items-center gap-1.5 text-sm font-semibold text-surface-600 hover:text-surface-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Thoát
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-surface-900 text-sm">{selectedModule?.title}</span>
            <Badge variant={LEVEL_BADGE[selectedModule?.level]}>{selectedModule?.level}</Badge>
          </div>
          <TimerCircle timeLeft={timeLeft} />
        </div>

        {/* Progress */}
        <div className="mb-6">
          <p className="text-sm text-surface-500 font-medium mb-2">Câu {currentQ + 1} / {total}</p>
          <div className="h-2 w-full bg-surface-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary-500"
              animate={{ width: `${((currentQ + 1) / total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-surface-200 rounded-2xl p-8 shadow-sm"
          >
            <span className="inline-block bg-primary-50 text-primary-700 rounded-full px-3 py-1 text-sm font-bold mb-4">
              Câu {currentQ + 1}
            </span>
            <p className="font-bold text-xl text-surface-900 leading-relaxed mb-6">{q.question}</p>

            <div className="flex flex-col gap-3">
              {q.options.map((opt, i) => {
                const selected = answers[currentQ] === i;
                return (
                  <button
                    key={i}
                    onClick={() => { setAnswers(prev => ({ ...prev, [currentQ]: i })); setTimeLeft(60); }}
                    className={clsx(
                      'flex items-center gap-3 w-full text-left border rounded-xl p-4 transition-all font-medium',
                      selected
                        ? 'bg-primary-50 border-primary-400 text-primary-800'
                        : 'bg-white border-surface-200 text-surface-700 hover:bg-surface-50'
                    )}
                  >
                    <div className={clsx(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                      selected ? 'border-primary-500 bg-primary-500' : 'border-surface-300'
                    )}>
                      {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    {opt}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            disabled={currentQ === 0}
            onClick={() => { setCurrentQ(q => q - 1); setTimeLeft(60); }}
            className={clsx('flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors',
              currentQ === 0 ? 'opacity-40 cursor-not-allowed bg-white border-surface-200' : 'bg-white border-surface-200 hover:bg-surface-50'
            )}
          >
            <ArrowLeft className="w-4 h-4" /> Câu trước
          </button>

          {/* dot indicators */}
          <div className="hidden sm:flex gap-1.5">
            {questions.map((_, i) => (
              <div key={i} className={clsx('w-2 h-2 rounded-full transition-colors',
                i === currentQ ? 'bg-primary-400 ring-2 ring-primary-200' :
                answers[i] !== undefined ? 'bg-primary-500' : 'bg-surface-200'
              )} />
            ))}
          </div>

          {currentQ < total - 1 ? (
            <button
              disabled={!answered}
              onClick={() => { setCurrentQ(q => q + 1); setTimeLeft(60); }}
              className={clsx('px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
                answered ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-surface-100 text-surface-400 cursor-not-allowed'
              )}
            >
              Câu tiếp →
            </button>
          ) : (
            <button
              disabled={!allAnswered}
              onClick={submitQuiz}
              className={clsx('px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
                allAnswered ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-surface-100 text-surface-400 cursor-not-allowed'
              )}
            >
              Nộp bài ✓
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── PHASE: RESULT ──────────────────────────────────────────────────────────
  if (phase === 'result' && resultData) {
    const { score, correct, total: tot } = resultData;
    const passed = score >= 80;

    return (
      <div className="max-w-lg mx-auto px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-surface-200 rounded-3xl p-10 shadow-sm"
        >
          <ScoreArc score={score} />

          <div className="mt-6">
            {passed ? (
              <>
                <h2 className="text-2xl font-extrabold text-primary-600">🎉 Xuất sắc!</h2>
                <p className="text-surface-500 font-medium mt-1">Bạn đã vượt qua bài kiểm tra</p>
                <Badge variant="success" className="mt-2 px-4 py-1.5 text-sm">✓ Đạt chứng nhận</Badge>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-extrabold text-amber-600">Cần cố gắng hơn 💪</h2>
                <p className="text-surface-500 font-medium mt-1">Điểm tối thiểu để đạt: 80/100</p>
                <Badge variant="warning" className="mt-2 px-4 py-1.5 text-sm">Chưa đạt — thử lại nhé</Badge>
              </>
            )}
          </div>

          <div className="flex justify-center gap-10 mt-6 py-6 border-y border-surface-100">
            <div><p className="text-2xl font-bold text-green-600">{correct}</p><p className="text-xs text-surface-500 font-medium">Câu đúng</p></div>
            <div><p className="text-2xl font-bold text-red-400">{tot - correct}</p><p className="text-xs text-surface-500 font-medium">Câu sai</p></div>
            <div><p className="text-2xl font-bold text-primary-600">{score}</p><p className="text-xs text-surface-500 font-medium">Điểm số</p></div>
          </div>

          {/* Answer review */}
          <div className="mt-6 text-left">
            <h3 className="font-bold text-surface-900 mb-3">Xem lại đáp án</h3>
            <div className="flex flex-col gap-2">
              {questions.map((q, i) => {
                const isCorrect = answers[i] === q.answer;
                return (
                  <div key={i} className={clsx('p-3 rounded-xl border flex gap-3 items-start',
                    isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  )}>
                    {isCorrect
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      : <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />}
                    <div>
                      <p className="text-sm font-semibold text-surface-800">{q.question}</p>
                      <p className="text-xs text-surface-500 font-medium mt-0.5">Đáp án đúng: {q.options[q.answer]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 justify-center mt-8 flex-wrap">
            {passed ? (
              <>
                <Button variant="primary" icon={Award} onClick={() => setShowCert(true)}>Xem chứng nhận</Button>
                <Button variant="secondary" onClick={() => startQuiz(selectedModule)}>Làm lại</Button>
              </>
            ) : (
              <>
                <Button variant="primary" onClick={() => startQuiz(selectedModule)}>Làm lại ngay</Button>
                <Button variant="secondary" onClick={() => setPhase('select')}>Về chọn module</Button>
              </>
            )}
          </div>
        </motion.div>

        <CertModal
          open={showCert}
          onClose={() => setShowCert(false)}
          user={user}
          module={selectedModule}
          score={resultData.score}
        />
      </div>
    );
  }

  return null;
}
