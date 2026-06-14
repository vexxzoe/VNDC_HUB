import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/utils/api';
import { Avatar, Badge, Button } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  User, Lock, Bell, CheckCircle2, Eye, EyeOff,
  Monitor, BarChart2, FileText, ClipboardCheck, Settings2,
  Info, Mail
} from 'lucide-react';

// Inline Toggle Switch Component
function ToggleSwitch({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative w-11 h-6 rounded-full cursor-pointer transition-colors duration-200',
        checked ? 'bg-primary-500' : 'bg-surface-300'
      )}
    >
      <div className={clsx(
        'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
        checked ? 'translate-x-5' : 'translate-x-0.5'
      )} />
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  })
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || '',
      })
    }
  }, [user])

  // Password Form
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Notification Settings
  const [notifSettings, setNotifSettings] = useState({
    email: true, push: true, weeklyReport: false,
    newDoc: true, quizReminder: true, systemUpdate: false
  });



  const handleSaveProfile = async () => {
    if (!profileForm.name?.trim()) {
      toast.error('Họ tên không được để trống')
      return
    }
    try {
      const data = await api.updateProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone || '',
        bio: profileForm.bio || '',
      })
      // Cập nhật user trong localStorage để giữ tên mới
      const stored = JSON.parse(localStorage.getItem('vndc_user') || '{}')
      localStorage.setItem('vndc_user', JSON.stringify({
        ...stored,
        name: data.user.name,
        phone: data.user.phone,
        bio: data.user.bio,
      }))
      setSaveSuccess(true)
      toast.success('Đã lưu thông tin!')
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      toast.error('Lỗi lưu thông tin: ' + err.message)
    }
  }

  const handleResetProfile = () => {
    setProfileForm({ name: user?.name || '', phone: user?.phone || '', bio: user?.bio || '' });
  };

  const calcStrength = (pass) => {
    if (!pass) return null;
    if (pass.length < 6) return 'weak';
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) return 'strong';
    return 'medium';
  };

  const handleSavePassword = async () => {
    // Validate trước
    const errors = {}
    if (!passwordForm.current)
      errors.current = 'Vui lòng nhập mật khẩu hiện tại'
    if (passwordForm.newPass.length < 6)
      errors.newPass = 'Tối thiểu 6 ký tự'
    if (passwordForm.newPass !== passwordForm.confirm)
      errors.confirm = 'Mật khẩu không khớp'

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      return
    }

    try {
      const result = await api.changePassword(
        passwordForm.current,
        passwordForm.newPass
      )
      toast.success('Đổi mật khẩu thành công! Đang đăng xuất...')
      
      // Xoá token cũ khỏi localStorage
      localStorage.removeItem('vndc_user')
      
      // Redirect về login sau 2 giây
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } catch (err) {
      if (err.message.includes('không đúng') ||
          err.message.includes('incorrect')) {
        setPasswordErrors({ current: 'Mật khẩu hiện tại không đúng' })
      } else {
        setPasswordErrors({ current: err.message })
      }
    }
  };

  const handleToggleNotif = (key) => {
    setNotifSettings(p => ({ ...p, [key]: !p[key] }));
    toast.info('Đã cập nhật tuỳ chọn');
  };

  const strength = calcStrength(passwordForm.newPass);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Cài đặt</h1>
        <p className="text-sm text-surface-500 font-medium mt-1">Quản lý thông tin và tuỳ chọn tài khoản</p>
      </div>

      <div className="flex gap-1 p-1 bg-surface-100 rounded-xl mb-6 w-fit">
        {[
          { id: 'profile', icon: User, label: 'Hồ sơ' },
          { id: 'security', icon: Lock, label: 'Bảo mật' },
          { id: 'notifications', icon: Bell, label: 'Thông báo' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              activeTab === tab.id ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500 hover:text-surface-700'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm">
          <AnimatePresence>
            {saveSuccess && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Thông tin đã được lưu thành công
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-5 mb-6 pb-6 border-b border-surface-100">
            <Avatar name={user?.name} size="xl" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="font-bold text-lg text-surface-900">{profileForm.name || user?.name}</p>
                <Badge variant="default" className="text-[10px]">{user?.department}</Badge>
                <Badge variant={user?.role === 'admin' ? 'primary' : 'surface'} className="text-[10px]">{user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</Badge>
              </div>
              <Button variant="secondary" size="sm" onClick={() => toast.info('Tính năng upload ảnh sẽ có sau')}>Đổi ảnh đại diện</Button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-surface-600 mb-1.5 block">Họ và tên</label>
              <input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-surface-600 mb-1.5 block">Email</label>
              <input value={profileForm.email} disabled className="w-full px-3 py-2 border border-surface-100 bg-surface-50 text-surface-500 rounded-xl text-sm font-medium" />
              <p className="text-[11px] text-surface-400 font-medium mt-1">Email không thể thay đổi</p>
            </div>
            <div>
              <label className="text-xs font-bold text-surface-600 mb-1.5 block">Số điện thoại</label>
              <input type="tel" placeholder="0901 234 567" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-surface-600 mb-1.5 block">Giới thiệu bản thân</label>
              <textarea rows={3} placeholder="Mô tả ngắn về bạn..." value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-primary-500 outline-none resize-none" />
            </div>
            
            <div className="bg-surface-50 border border-surface-100 rounded-xl p-4 grid grid-cols-2 gap-y-3 gap-x-4 mt-2">
              <div><p className="text-xs text-surface-400 font-medium">Phòng ban</p><p className="text-sm font-semibold text-surface-800">{user?.department}</p></div>
              <div><p className="text-xs text-surface-400 font-medium">Vai trò</p><p className="text-sm font-semibold text-surface-800">{user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</p></div>
              <div><p className="text-xs text-surface-400 font-medium">Ngày tham gia</p><p className="text-sm font-semibold text-surface-800">{user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '—'}</p></div>
              <div><p className="text-xs text-surface-400 font-medium mb-1">Trạng thái</p><Badge variant="success" className="text-[10px]">Đang hoạt động</Badge></div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="primary" onClick={handleSaveProfile}>Lưu thay đổi</Button>
            <Button variant="secondary" onClick={handleResetProfile}>Huỷ</Button>
          </div>
        </motion.div>
      )}

      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm">
          <div className="bg-surface-50 border border-surface-100 rounded-xl p-3 mb-6 flex items-start gap-2">
            <Info className="w-5 h-5 text-surface-400 shrink-0 mt-0.5" />
            <p className="text-sm text-surface-600 font-medium">Mật khẩu demo hiện tại: <code className="bg-white px-1.5 py-0.5 rounded border border-surface-200 text-primary-600 font-bold">123456</code></p>
          </div>

          <h3 className="font-bold text-surface-900 mb-4">Đổi mật khẩu</h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-surface-600 mb-1.5 block">Mật khẩu hiện tại</label>
              <div className="relative">
                <input type={showCurrent ? "text" : "password"} value={passwordForm.current} onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))} className={clsx('w-full pl-3 pr-10 py-2 border rounded-xl text-sm font-medium focus:ring-1 focus:ring-primary-500 outline-none', passwordErrors.current ? 'border-red-400' : 'border-surface-200')} />
                <button onClick={() => setShowCurrent(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">{showCurrent ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
              </div>
              {passwordErrors.current && <p className="text-xs text-red-500 font-medium mt-1">{passwordErrors.current}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-surface-600 mb-1.5 block">Mật khẩu mới</label>
              <div className="relative">
                <input type={showNew ? "text" : "password"} value={passwordForm.newPass} onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))} className={clsx('w-full pl-3 pr-10 py-2 border rounded-xl text-sm font-medium focus:ring-1 focus:ring-primary-500 outline-none', passwordErrors.newPass ? 'border-red-400' : 'border-surface-200')} />
                <button onClick={() => setShowNew(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">{showNew ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
              </div>
              {passwordErrors.newPass && <p className="text-xs text-red-500 font-medium mt-1">{passwordErrors.newPass}</p>}
              
              {strength && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1">
                    <div className={clsx('w-8 h-1 rounded-full', strength === 'weak' ? 'bg-red-500' : strength === 'medium' ? 'bg-amber-500' : 'bg-green-500')} />
                    <div className={clsx('w-8 h-1 rounded-full', strength === 'weak' ? 'bg-surface-200' : strength === 'medium' ? 'bg-amber-500' : 'bg-green-500')} />
                    <div className={clsx('w-8 h-1 rounded-full', strength === 'strong' ? 'bg-green-500' : 'bg-surface-200')} />
                  </div>
                  <span className={clsx('text-[11px] font-bold', strength === 'weak' ? 'text-red-500' : strength === 'medium' ? 'text-amber-500' : 'text-green-500')}>
                    {strength === 'weak' ? 'Yếu' : strength === 'medium' ? 'Trung bình' : 'Mạnh'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-surface-600 mb-1.5 block">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} className={clsx('w-full pl-3 pr-10 py-2 border rounded-xl text-sm font-medium focus:ring-1 focus:ring-primary-500 outline-none', passwordErrors.confirm ? 'border-red-400' : 'border-surface-200')} />
                {passwordForm.confirm.length > 0 && passwordForm.confirm === passwordForm.newPass && (
                  <CheckCircle2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                )}
              </div>
              {passwordErrors.confirm && <p className="text-xs text-red-500 font-medium mt-1">{passwordErrors.confirm}</p>}
            </div>

            <Button variant="primary" className="justify-center mt-2" onClick={handleSavePassword}>Đổi mật khẩu</Button>
          </div>

          <div className="h-px bg-surface-100 my-8" />

          <h3 className="font-bold text-surface-900 mb-4">Phiên đăng nhập</h3>
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center justify-between p-4 border border-surface-200 rounded-xl bg-surface-50">
              <div>
                <p className="font-semibold text-sm text-surface-900">Máy tính này — Chrome</p>
                <p className="text-xs text-surface-500 font-medium mt-0.5">Hồ Chí Minh</p>
              </div>
              <Badge variant="success" className="text-[10px]">Đang hoạt động</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border border-surface-200 rounded-xl">
              <div>
                <p className="font-semibold text-sm text-surface-900">Điện thoại — Safari</p>
                <p className="text-xs text-surface-500 font-medium mt-0.5">Hồ Chí Minh</p>
              </div>
              <span className="text-xs text-surface-400 font-medium">2 ngày trước</span>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={() => toast.success('Đã đăng xuất tất cả phiên khác')}>Đăng xuất tất cả thiết bị khác</Button>
        </motion.div>
      )}

      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col divide-y divide-surface-100">
            {[
              { key: 'email', icon: Mail, label: 'Thông báo email', desc: 'Nhận email khi có tài liệu mới hoặc nhắc học' },
              { key: 'push', icon: Monitor, label: 'Thông báo đẩy', desc: 'Thông báo trực tiếp trên trình duyệt' },
              { key: 'weeklyReport', icon: BarChart2, label: 'Báo cáo tuần', desc: 'Tóm tắt hoạt động học tập mỗi tuần' },
              { key: 'newDoc', icon: FileText, label: 'Tài liệu mới', desc: 'Thông báo khi có tài liệu mới trong phòng ban' },
              { key: 'quizReminder', icon: ClipboardCheck, label: 'Nhắc quiz', desc: 'Nhắc nhở khi có quiz sắp đến hạn' },
              { key: 'systemUpdate', icon: Settings2, label: 'Cập nhật hệ thống', desc: 'Thông báo khi hệ thống được nâng cấp' },
            ].map(setting => (
              <div key={setting.key} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <setting.icon className="w-5 h-5 text-primary-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-surface-900">{setting.label}</p>
                    <p className="text-xs text-surface-500 font-medium mt-0.5">{setting.desc}</p>
                  </div>
                </div>
                <ToggleSwitch checked={notifSettings[setting.key] ?? false} onChange={() => handleToggleNotif(setting.key)} />
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button variant="primary" onClick={() => toast.success('Đã lưu tuỳ chọn thông báo')}>Lưu tuỳ chọn</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
