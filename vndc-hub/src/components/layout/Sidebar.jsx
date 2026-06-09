import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { 
  LayoutDashboard, GraduationCap, Bookmark, Library, 
  PlayCircle, FileText, ClipboardCheck, TrendingUp, 
  Upload, Users, ShieldCheck, BarChart2, Settings, X 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, Badge } from '@/components/ui';

const NAV_GROUPS = [
  {
    title: 'Tổng quan',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { label: 'Lộ trình học', icon: GraduationCap, path: '/courses', badge: { text: '3 mới', variant: 'primary' } },
      { label: 'Tài liệu của tôi', icon: Bookmark, path: '/library?tab=bookmarks' },
    ]
  },
  {
    title: 'Kho học liệu',
    items: [
      { label: 'Thư viện', icon: Library, path: '/library' },
      { label: 'Video đào tạo', icon: PlayCircle, path: '/videos', badge: { text: 'Mới', variant: 'success' } },
      { label: 'Biểu mẫu', icon: FileText, path: '/forms' },
    ]
  },
  {
    title: 'Đánh giá',
    items: [
      { label: 'Quiz & Chứng nhận', icon: ClipboardCheck, path: '/quiz', badge: { text: 'Quiz', variant: 'warning' } },
      { label: 'Tiến độ', icon: TrendingUp, path: '/progress' },
    ]
  },
  {
    title: 'Quản trị',
    items: [
      { label: 'Cập nhật tài liệu', icon: Upload, path: '/updates' },
      { label: 'Nhân viên', icon: Users, path: '/people' },
      { label: 'Phân quyền', icon: ShieldCheck, path: '/access', adminOnly: true },
      { label: 'Analytics', icon: BarChart2, path: '/analytics', adminOnly: true },
      { label: 'Cài đặt', icon: Settings, path: '/settings' },
    ]
  }
];

export default function Sidebar({ open, onClose }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  return (
    <motion.aside
      className={clsx(
        'fixed inset-y-0 left-0 z-40 w-[260px] flex-shrink-0 flex flex-col bg-white border-r border-surface-200 overflow-y-auto',
        'md:sticky md:top-0 md:h-screen transition-transform duration-250 ease-spring'
      )}
      initial={false}
      animate={{ x: open ? 0 : (window.innerWidth < 768 ? '-100%' : 0) }}
    >
      <div className="h-[64px] shrink-0 border-b border-surface-200 flex items-center px-6 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl text-white flex items-center justify-center font-bold text-xl">
            V
          </div>
          <div>
            <div className="font-bold text-[16px] text-surface-900 leading-tight">VNDC HUB</div>
            <div className="text-xs text-surface-400 font-medium">v1.0</div>
          </div>
        </div>
        <button className="md:hidden text-surface-400 hover:text-surface-600" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6">
        {NAV_GROUPS.map((group, idx) => {
          const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx}>
              {idx > 0 && <div className="text-xs font-bold uppercase tracking-wider text-surface-400 px-3 mb-2">{group.title}</div>}
              <ul className="space-y-1">
                {visibleItems.map((item, i) => {
                  const isActive = location.pathname.startsWith(item.path.split('?')[0]);
                  const Icon = item.icon;
                  
                  return (
                    <li key={i}>
                      <NavLink
                        to={item.path}
                        onClick={() => window.innerWidth < 768 && onClose()}
                        className={clsx(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-colors',
                          isActive 
                            ? 'bg-primary-50 text-primary-700 font-bold border-l-[3px] border-primary-600'
                            : 'text-surface-600 hover:bg-surface-100 hover:text-surface-800 font-medium'
                        )}
                        style={isActive ? { paddingLeft: 'calc(0.75rem - 3px)' } : {}}
                      >
                        <Icon className={clsx('w-5 h-5 shrink-0', isActive ? 'text-primary-600' : 'text-surface-400')} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <Badge variant={item.badge.variant} className="shrink-0 text-[10px] px-1.5 py-0 h-4">
                            {item.badge.text}
                          </Badge>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-surface-100 p-4 sticky bottom-0 bg-white">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name} src={user?.avatar && user.avatar.length > 2 ? user.avatar : undefined} size="md" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-surface-900 truncate">{user?.name}</div>
            <div className="text-xs text-surface-500 truncate">{user?.department}</div>
          </div>
          <Badge variant={user?.role === 'admin' ? 'primary' : 'default'} size="sm" className="shrink-0 text-[10px] uppercase">
            {user?.role}
          </Badge>
        </div>
      </div>
    </motion.aside>
  );
}
