import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, BookOpen, GraduationCap, Bot, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Input, Button, Badge } from '@/components/ui';



export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setErrorMsg('');
  }, [email, password]);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setLoading(true);
    
    if (!email || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu');
      triggerShake();
      setLoading(false);
      return;
    }
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setErrorMsg(result.error || 'Email hoặc mật khẩu không đúng');
        triggerShake();
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg('Có lỗi xảy ra. Vui lòng thử lại.');
      triggerShake();
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };



  const TogglePasswordIcon = showPassword ? EyeOff : Eye;

  return (
    <div className="min-h-screen w-full flex bg-surface-50">
      <AnimatePresence>
        <motion.div 
          className="flex w-full min-h-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Left panel */}
          <div className="hidden sm:flex flex-col justify-between w-[40%] bg-primary-700 text-white p-12 lg:p-16">
            <div className="space-y-6">
              <div className="w-14 h-14 bg-white text-primary-700 rounded-2xl flex items-center justify-center text-3xl font-extrabold shadow-lg">
                V
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">VNDC HUB</h1>
                <p className="text-primary-100 text-lg">Hệ thống quản lý tri thức & đào tạo nội bộ</p>
              </div>
              <div className="h-px bg-primary-600 my-8 w-16" />
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-primary-50">
                  <BookOpen className="w-6 h-6 shrink-0 opacity-80" />
                  <span className="text-lg">Thư viện tài liệu tập trung</span>
                </div>
                <div className="flex items-center gap-4 text-primary-50">
                  <GraduationCap className="w-6 h-6 shrink-0 opacity-80" />
                  <span className="text-lg">Lộ trình đào tạo theo phòng ban</span>
                </div>
                <div className="flex items-center gap-4 text-primary-50">
                  <Bot className="w-6 h-6 shrink-0 opacity-80" />
                  <span className="text-lg">Trợ lý AI hỏi đáp 24/7</span>
                </div>
              </div>
            </div>
            <div className="text-primary-300 text-sm">
              v1.0 · Demo
            </div>
          </div>

          {/* Right panel */}
          <div className="w-full sm:w-[60%] bg-white flex flex-col justify-center items-center p-6 sm:p-12">
            <motion.div 
              className="w-full max-w-md space-y-8"
              animate={shake ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-surface-900 mb-2">Đăng nhập</h2>
                <p className="text-surface-500">Chào mừng trở lại 👋</p>
              </div>

              <form onSubmit={handleLogin} autoComplete="off" className="space-y-5">
                <div className="space-y-4">
                  <Input 
                    label="Email" 
                    type="email"
                    autoComplete="username"
                    placeholder="Nhập email của bạn" 
                    icon={Mail} 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                  <div className="relative">
                    <Input 
                      label="Mật khẩu" 
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••" 
                      icon={Lock} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-[34px] p-1 text-surface-400 hover:text-surface-600 rounded-md focus:outline-none"
                    >
                      <TogglePasswordIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full" 
                  size="lg"
                  loading={loading}
                >
                  Đăng nhập
                </Button>
              </form>


            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
