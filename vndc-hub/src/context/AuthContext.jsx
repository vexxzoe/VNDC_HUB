import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { api } from '@/utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // Restore user từ localStorage khi mount, verify qua /me
  useEffect(() => {
    const stored = localStorage.getItem('vndc_user');
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setUser(userData); // set ngay để tránh flash
        api.getMe()
          .then(data => {
            const merged = { ...userData, ...data.user };
            setUser(merged);
            localStorage.setItem('vndc_user', JSON.stringify(merged));
          })
          .catch(() => {
            localStorage.removeItem('vndc_user');
            setUser(null);
          })
          .finally(() => setIsLoading(false));
      } catch {
        localStorage.removeItem('vndc_user');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      console.log('LOGIN: calling API...');
      const data = await api.login(email, password);
      console.log('LOGIN: success', data);
      const userData = {
        ...data.user,
        token: data.accessToken,
        refreshToken: data.refreshToken,
      };
      localStorage.setItem('vndc_user', JSON.stringify(userData));
      setUser(userData);
      toast.success('Đăng nhập thành công!');
      return { success: true };
    } catch (err) {
      console.log('LOGIN: error caught', err.message);
      toast.error(err.message || 'Email hoặc mật khẩu không chính xác');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const stored = JSON.parse(localStorage.getItem('vndc_user') || '{}');
      if (stored.refreshToken) await api.logout(stored.refreshToken);
    } catch {}
    localStorage.removeItem('vndc_user');
    setUser(null);
    toast.info('Đã đăng xuất');
  };

  const value = {
    user,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
