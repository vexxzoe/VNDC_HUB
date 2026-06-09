import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Sun, Moon, Bell, FileText, Unlock, ClipboardCheck, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Avatar, Badge } from '@/components/ui';
import { useNavigate } from 'react-router-dom';
import { api } from '@/utils/api';

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  return `${days} ngày trước`;
}

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // FIX 4: Load notifications từ API
  useEffect(() => {
    api.getNotifications()
      .then(data => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread || 0);
      })
      .catch(console.error);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 shrink-0 h-[64px] flex items-center gap-3 px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-surface-200">
      <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 text-surface-500 hover:text-surface-900 rounded-lg focus:outline-none">
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 flex items-center">
        <div className="relative w-full max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-surface-400 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Tìm tài liệu, quy trình, kỹ năng..."
            className={clsx(
              "w-full rounded-full bg-surface-50 border border-surface-200 py-2 pl-10 pr-4 text-sm transition-all",
              "focus:outline-none focus:border-primary-400 focus:shadow-glow-sm focus:bg-white"
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 transition-colors focus:outline-none"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={clsx(
              "w-9 h-9 flex items-center justify-center rounded-lg transition-colors focus:outline-none relative",
              notifOpen ? "bg-surface-100 text-surface-900" : "text-surface-500 hover:bg-surface-100"
            )}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white shadow-card-lg rounded-2xl border border-surface-200 overflow-hidden origin-top-right"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
                  <h3 className="font-bold text-surface-900">Thông báo {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{unreadCount}</span>}</h3>
                  <button className="text-xs font-medium text-primary-600 hover:text-primary-700" onClick={handleMarkAllRead}>Đánh dấu đã đọc</button>
                </div>
                <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-surface-500">Không có thông báo mới</div>
                  ) : notifications.map(n => (
                    <div
                      key={n.id}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors',
                        n.is_read ? 'hover:bg-surface-50' : 'bg-blue-50/50 hover:bg-blue-50'
                      )}
                      onClick={() => { handleMarkRead(n.id); setNotifOpen(false); if (n.link) navigate(n.link); }}
                    >
                      <div className={clsx(
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                        n.is_read ? 'bg-surface-100' : 'bg-primary-50'
                      )}>
                        <Bell size={14} className={n.is_read ? 'text-surface-400' : 'text-primary-600'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={clsx(
                          'text-sm line-clamp-2',
                          n.is_read ? 'text-surface-500' : 'text-surface-800 font-medium'
                        )}>
                          {n.text}
                        </p>
                        <p className="text-xs text-surface-400 mt-0.5">{formatRelativeTime(n.created_at)}</p>
                      </div>
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-surface-100 transition-colors focus:outline-none"
          >
            <span className="hidden sm:block text-sm font-medium text-surface-700">{user?.name?.split(' ').pop()}</span>
            <Avatar name={user?.name} size="sm" />
          </button>

          <AnimatePresence>
            {userOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 bg-white shadow-card-lg rounded-2xl border border-surface-200 overflow-hidden origin-top-right p-1.5"
              >
                <div className="px-3 py-3 border-b border-surface-100 mb-1">
                  <div className="font-bold text-surface-900">{user?.name}</div>
                  <div className="text-xs text-surface-500 mt-0.5">{user?.email}</div>
                  <Badge variant={user?.role === 'admin' ? 'primary' : 'default'} size="sm" className="mt-2 text-[10px] uppercase">
                    {user?.role}
                  </Badge>
                </div>
                
                <button
                  onClick={() => { setUserOpen(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 hover:text-surface-900 rounded-lg transition-colors"
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span>Cài đặt</span>
                </button>
                <button
                  onClick={() => { setUserOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
}
