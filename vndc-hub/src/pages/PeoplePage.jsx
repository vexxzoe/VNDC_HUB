import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { EMPLOYEES } from '@/data/mockData';
import { Avatar, Badge, Button } from '@/components/ui';
import { formatRelativeTime } from '@/utils/formatTime';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  Users, ShieldCheck, Building2, UserPlus, Search,
  List, LayoutGrid, Edit2, Trash2, X, User, Mail, ChevronDown, ChevronUp
} from 'lucide-react';

const DEPARTMENTS = ['Kinh doanh', 'CSKH', 'Kỹ thuật', 'Nhân sự', 'Vận hành', 'Quản trị'];

function StatCard({ icon: Icon, label, value, accent }) {
  const bg = accent === 'primary' ? 'bg-primary-50 text-primary-600' : accent === 'success' ? 'bg-green-50 text-green-600' : 'bg-surface-100 text-surface-500';
  const vc = accent === 'primary' ? 'text-primary-600' : accent === 'success' ? 'text-green-600' : 'text-surface-900';
  return (
    <div className="bg-white border border-surface-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm flex-1">
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className={clsx('text-2xl font-extrabold', vc)}>{value}</div>
        <div className="text-xs text-surface-500 font-medium">{label}</div>
      </div>
    </div>
  );
}

const EMPTY_FORM = { name: '', email: '', department: 'Kinh doanh', role: 'member' };

export default function PeoplePage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [employees, setEmployees] = useState(EMPLOYEES);
  const [viewMode, setViewMode]   = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState({});
  const [editingId, setEditingId]     = useState(null);
  const [editData, setEditData]       = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const uniqueDepts   = [...new Set(employees.map(e => e.department))];
  const newCount      = employees.filter(e => new Date(e.joinedAt) >= thirtyDaysAgo).length;
  const adminCount    = employees.filter(e => e.role === 'admin').length;

  const filtered = useMemo(() =>
    employees.filter(e =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department.toLowerCase().includes(searchQuery.toLowerCase())
    ), [employees, searchQuery]);

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(e => {
      if (!g[e.department]) g[e.department] = [];
      g[e.department].push(e);
    });
    return g;
  }, [filtered]);

  const validateAdd = () => {
    const errs = {};
    if (!newEmployee.name.trim()) errs.name = 'Vui lòng nhập họ tên';
    if (!newEmployee.email.includes('@')) errs.email = 'Email không hợp lệ';
    if (employees.some(e => e.email === newEmployee.email)) errs.email = 'Email đã tồn tại';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAdd = () => {
    if (!validateAdd()) return;
    const emp = {
      id: 'emp-' + Date.now(),
      name: newEmployee.name.trim(),
      email: newEmployee.email.trim(),
      department: newEmployee.department,
      role: newEmployee.role,
      joinedAt: new Date().toISOString().split('T')[0],
    };
    setEmployees(prev => [...prev, emp]);
    toast.success('Đã thêm ' + emp.name);
    setShowAddForm(false);
    setNewEmployee(EMPTY_FORM);
    setFormErrors({});
  };

  const handleSaveEdit = (id) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...editData } : e));
    toast.success('Đã cập nhật thông tin');
    setEditingId(null);
  };

  const handleDelete = (emp) => {
    setEmployees(prev => prev.filter(e => e.id !== emp.id));
    toast.success('Đã xoá ' + emp.name);
    setConfirmDeleteId(null);
  };

  const startEdit = (emp) => {
    setEditingId(emp.id);
    setEditData({ name: emp.name, department: emp.department, role: emp.role });
  };

  const toggleGroup = (dept) => setCollapsedGroups(p => ({ ...p, [dept]: !p[dept] }));

  const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Nhân viên & Nhóm</h1>
          <p className="text-sm text-surface-500 font-medium mt-1">{employees.length} nhân viên · {uniqueDepts.length} phòng ban</p>
        </div>
        {isAdmin && (
          <Button variant="secondary" icon={UserPlus} onClick={() => setShowAddForm(true)}>Thêm nhân viên</Button>
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        <StatCard icon={Users}      label="Tổng nhân viên" value={employees.length} />
        <StatCard icon={ShieldCheck} label="Quản trị viên"  value={adminCount}        accent="primary" />
        <StatCard icon={Building2}  label="Phòng ban"       value={uniqueDepts.length} />
        <StatCard icon={UserPlus}   label="Mới tháng này"   value={newCount}           accent="success" />
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-surface-900">Thêm nhân viên mới</h2>
                <button onClick={() => { setShowAddForm(false); setNewEmployee(EMPTY_FORM); setFormErrors({}); }} className="w-8 h-8 rounded-full hover:bg-surface-100 flex items-center justify-center text-surface-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-surface-600 mb-1.5 block">Họ tên *</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input value={newEmployee.name} onChange={e => setNewEmployee(p=>({...p,name:e.target.value}))}
                      className={clsx('w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary-500', formErrors.name ? 'border-red-400' : 'border-surface-200')}
                      placeholder="Nguyễn Văn A" />
                  </div>
                  {formErrors.name && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-surface-600 mb-1.5 block">Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input type="email" value={newEmployee.email} onChange={e => setNewEmployee(p=>({...p,email:e.target.value}))}
                      className={clsx('w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary-500', formErrors.email ? 'border-red-400' : 'border-surface-200')}
                      placeholder="email@vndc.vn" />
                  </div>
                  {formErrors.email && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-surface-600 mb-1.5 block">Phòng ban</label>
                  <select value={newEmployee.department} onChange={e => setNewEmployee(p=>({...p,department:e.target.value}))}
                    className="w-full px-3 py-2.5 border border-surface-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white">
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-surface-600 mb-1.5 block">Vai trò</label>
                  <select value={newEmployee.role} onChange={e => setNewEmployee(p=>({...p,role:e.target.value}))}
                    className="w-full px-3 py-2.5 border border-surface-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white">
                    <option value="member">Nhân viên</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-5 justify-end">
                <Button variant="secondary" onClick={() => { setShowAddForm(false); setNewEmployee(EMPTY_FORM); setFormErrors({}); }}>Huỷ</Button>
                <Button variant="primary" icon={UserPlus} onClick={handleAdd}>Thêm vào hệ thống</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, email, phòng ban..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary-500" />
        </div>
        <div className="flex border border-surface-200 rounded-xl overflow-hidden bg-white">
          <button onClick={() => setViewMode('list')} className={clsx('p-2.5 transition-colors', viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-surface-500 hover:bg-surface-50')}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('group')} className={clsx('p-2.5 transition-colors', viewMode === 'group' ? 'bg-primary-600 text-white' : 'text-surface-500 hover:bg-surface-50')}>
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-surface-200 text-center gap-3">
          <Users className="w-12 h-12 text-surface-300" />
          <p className="font-semibold text-surface-600">Không tìm thấy nhân viên</p>
          <button onClick={() => setSearchQuery('')} className="text-sm text-primary-600 font-semibold hover:underline">Xoá bộ lọc</button>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && filtered.length > 0 && (
        <div className="bg-white border border-surface-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-surface-50 border-b border-surface-100">
            {['Nhân viên','Phòng ban','Vai trò','Ngày vào',''].map(h => (
              <span key={h} className="text-[11px] font-bold uppercase tracking-wider text-surface-400">{h}</span>
            ))}
          </div>

          <div className="divide-y divide-surface-50">
            <AnimatePresence initial={false}>
              {filtered.map(emp => (
                <motion.div key={emp.id} layout exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-surface-50 transition-colors">
                    {/* Employee */}
                    <div className="flex items-center gap-3">
                      <Avatar name={emp.name} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-surface-900 truncate">{emp.name}</p>
                        <p className="text-xs text-surface-500 font-medium hidden sm:block truncate">{emp.email}</p>
                      </div>
                    </div>
                    {/* Dept */}
                    <div className="hidden md:block">
                      <Badge variant="default" className="text-[11px]">{emp.department}</Badge>
                    </div>
                    {/* Role */}
                    <div className="hidden md:block">
                      <Badge variant={emp.role === 'admin' ? 'primary' : 'default'} className="text-[11px]">
                        {emp.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
                      </Badge>
                    </div>
                    {/* Date */}
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-surface-700">{formatDate(emp.joinedAt)}</p>
                      <p className="text-xs text-surface-400 font-medium">{formatRelativeTime(emp.joinedAt)}</p>
                    </div>
                    {/* Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        {confirmDeleteId === emp.id ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleDelete(emp)} className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600">Xoá</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-xs font-bold text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200">Huỷ</button>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => startEdit(emp)} className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setConfirmDeleteId(emp.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Inline edit */}
                  <AnimatePresence>
                    {editingId === emp.id && (
                      <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                        className="border-t border-surface-100 bg-primary-50/30 px-5 py-4 overflow-hidden">
                        <div className="flex flex-wrap gap-3 items-end">
                          <div className="flex-1 min-w-[160px]">
                            <label className="text-xs font-bold text-surface-600 mb-1 block">Họ tên</label>
                            <input value={editData.name || ''} onChange={e => setEditData(p=>({...p,name:e.target.value}))}
                              className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary-500" />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-surface-600 mb-1 block">Phòng ban</label>
                            <select value={editData.department || ''} onChange={e => setEditData(p=>({...p,department:e.target.value}))}
                              className="px-3 py-2 border border-surface-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white">
                              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-surface-600 mb-1 block">Vai trò</label>
                            <select value={editData.role || ''} onChange={e => setEditData(p=>({...p,role:e.target.value}))}
                              className="px-3 py-2 border border-surface-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white">
                              <option value="member">Nhân viên</option>
                              <option value="admin">Quản trị viên</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveEdit(emp.id)} className="px-3 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700 transition-colors">Lưu</button>
                            <button onClick={() => setEditingId(null)} className="px-3 py-2 bg-surface-100 text-surface-700 text-xs font-bold rounded-xl hover:bg-surface-200 transition-colors">Huỷ</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* GROUP VIEW */}
      {viewMode === 'group' && filtered.length > 0 && (
        <div className="flex flex-col gap-5">
          {Object.entries(grouped).map(([dept, members]) => {
            const collapsed = collapsedGroups[dept];
            return (
              <div key={dept} className="bg-white border border-surface-200 rounded-2xl overflow-hidden shadow-sm">
                <button onClick={() => toggleGroup(dept)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <h2 className="font-bold text-surface-900">{dept}</h2>
                    <Badge variant="default">{members.length}</Badge>
                  </div>
                  {collapsed ? <ChevronDown className="w-4 h-4 text-surface-400" /> : <ChevronUp className="w-4 h-4 text-surface-400" />}
                </button>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5 pt-0">
                        {members.map(emp => (
                          <div key={emp.id} className="relative bg-surface-50 border border-surface-100 rounded-xl p-4 flex flex-col items-center text-center gap-2">
                            {isAdmin && (
                              <button onClick={() => startEdit(emp)} className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-surface-400 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                            <Avatar name={emp.name} size="lg" />
                            <p className="font-bold text-surface-900 text-sm">{emp.name}</p>
                            <Badge variant={emp.role === 'admin' ? 'primary' : 'default'} className="text-[10px]">
                              {emp.role === 'admin' ? 'Quản trị' : 'Nhân viên'}
                            </Badge>
                            <p className="text-[11px] text-surface-400 font-medium truncate max-w-full">{emp.email}</p>
                            <p className="text-[11px] text-surface-400 font-medium">{formatDate(emp.joinedAt)}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
