import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { DOCUMENTS } from '@/data/mockData';
import { Trash2 } from 'lucide-react';
import { api } from '@/utils/api';
import { useDocSearch } from '@/hooks/useDocSearch';
import { getFilteredDocs } from '@/utils/permissions';
import { Button, Badge, Card, Modal, Input } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { 
  Upload, Plus, Search, X, FileText, Table2, Video, BookOpen, 
  ClipboardList, ShieldCheck, Eye, Star, Download, MoreVertical, SearchX, Rocket, HeartHandshake, TrendingUp, Wrench, Crown, Award, Unlock, Bell
} from 'lucide-react';
import DocumentViewer from '@/components/ui/DocumentViewer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const DEPARTMENTS = ['Tất cả', 'Chung', 'Kinh doanh', 'CSKH', 'Kỹ thuật', 'Vận hành', 'Nhân sự'];
const TYPES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'PDF', label: 'PDF', icon: FileText },
  { id: 'Excel', label: 'Excel', icon: Table2 },
  { id: 'Video', label: 'Video', icon: Video },
  { id: 'Module', label: 'Module', icon: BookOpen }
];

const ICON_MAP = {
  FileText, Table2, Video, BookOpen, ClipboardList, ShieldCheck, Rocket, HeartHandshake, TrendingUp, Wrench, Crown, Award, Unlock, Bell
};

const formatRelativeTime = (dateStr) => {
  const diffDays = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  const weeks = Math.floor(diffDays / 7);
  if (weeks < 4) return `${weeks} tuần trước`;
  const months = Math.floor(diffDays / 30);
  return `${months} tháng trước`;
};

export default function LibraryPage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  
  const [docs, setDocs] = useState(DOCUMENTS);
  const [docsLoading, setDocsLoading] = useState(true);

  // FIX 3: Load docs từ API khi mount
  useEffect(() => {
    const loadDocs = async () => {
      setDocsLoading(true);
      try {
        const data = await api.getDocuments();
        setDocs(data.documents || []);
      } catch (err) {
        toast.error('Không thể tải danh sách tài liệu');
        // fallback to mockData
      } finally {
        setDocsLoading(false);
      }
    };
    loadDocs();
  }, []);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDept, setUploadDept] = useState('Chung');

  const { query, setQuery, department, setDepartment, type, setType, results } = useDocSearch(docs);

  const activeDoc = openTabs.find(t => t.id === activeTab);

  const deptCounts = useMemo(() => {
    const counts = {};
    DEPARTMENTS.forEach(dept => {
      const d = dept === 'Tất cả' ? 'all' : dept;
      counts[dept] = getFilteredDocs(docs, user, d, 'all').length;
    });
    return counts;
  }, [docs, user]);

  const openDoc = (doc) => {
    if (!openTabs.find(t => t.id === doc.id)) {
      setOpenTabs([...openTabs, doc]);
    }
    setActiveTab(doc.id);
  };

  const closeTab = (docId, e) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t.id !== docId);
    setOpenTabs(newTabs);
    if (activeTab === docId) {
      setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
    }
  };

  const toggleBookmark = async (docId, e) => {
    if (e) e.stopPropagation();
    try {
      const result = await api.toggleBookmark(docId);
      setDocs(prev => prev.map(d => d.id === docId ? { ...d, bookmarked: result.bookmarked } : d));
      toast[result.bookmarked ? 'success' : 'info'](result.bookmarked ? 'Đã lưu tài liệu' : 'Đã bỏ lưu tài liệu');
    } catch {
      // Fallback local toggle
      setDocs(prev => prev.map(d => d.id === docId ? { ...d, bookmarked: !d.bookmarked } : d));
      const doc = docs.find(d => d.id === docId);
      if (doc) toast.success(doc.bookmarked ? 'Đã bỏ lưu tài liệu' : 'Đã lưu tài liệu');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };
  
  // FIX 2: Auto-fill tên từ filename
  const handleFileSelect = (file) => {
    setUploadFile(file);
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
    setUploadName(nameWithoutExt);
  };
  
  // FIX 1: Upload lưu vào DB thật
  const [uploading, setUploading] = useState(false);
  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadName) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('name', uploadName);
      formData.append('department', uploadDept);
      formData.append('audience', JSON.stringify(['all']));
      formData.append('tag', '');

      const response = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
        body: formData, // KHÔNG set Content-Type — browser tự set boundary
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Upload thất bại');
      }
      const data = await response.json();
      setDocs(prev => [data.document, ...prev]);
      toast.success('Tải lên thành công: ' + data.document.name);
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadName('');
      setUploadDept('Chung');
      openDoc(data.document);
    } catch (err) {
      toast.error('Lỗi upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // FIX 5: Xoá tài liệu (admin only)
  const handleDeleteDoc = async (doc, e) => {
    e.stopPropagation();
    if (!window.confirm(`Xoá tài liệu "${doc.name}"?`)) return;
    try {
      await api.deleteDocument(doc.id);
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      // Nếu đang mở tab, đóng lại
      setOpenTabs(prev => prev.filter(t => t.id !== doc.id));
      if (activeTab === doc.id) setActiveTab(null);
      toast.success('Đã xoá: ' + doc.name);
    } catch (err) {
      toast.error('Không thể xoá: ' + err.message);
    }
  };



  return (
    <div className="w-full flex-1 flex flex-col gap-6 px-4 sm:px-6 py-8 mx-auto max-w-[1400px]">
      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Thư viện tài liệu</h1>
          <p className="text-surface-500 mt-1">{results.length} tài liệu · cập nhật lần cuối {formatRelativeTime(DOCUMENTS[0].updatedAt)}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {user?.role === 'admin' && (
            <div className="flex gap-2">
              <Button variant="secondary" icon={Upload} onClick={() => setIsUploadOpen(true)} className="flex-1 sm:flex-none justify-center">
                Tải lên tài liệu
              </Button>
              <Button variant="primary" icon={Plus} onClick={() => setIsUploadOpen(true)} className="flex-1 sm:flex-none justify-center">
                Thêm tài liệu
              </Button>
            </div>
          )}
          {user?.role !== 'admin' && (
            <p className="text-sm text-slate-400 flex items-center h-full">
              Liên hệ Admin để thêm tài liệu mới
            </p>
          )}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="w-full rounded-2xl bg-white border border-surface-200 shadow-card flex items-center gap-3 px-4 py-3">
        <Search className="w-5 h-5 text-surface-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên, phòng ban, từ khoá... (thử: 'đổi trả', 'bảo hành')"
          className="flex-1 bg-transparent border-none outline-none text-surface-900 placeholder-surface-400 min-w-0"
        />
        {query && (
          <button onClick={() => setQuery('')} className="p-1 rounded-full hover:bg-surface-100 text-surface-400">
            <X className="w-4 h-4" />
          </button>
        )}
        {query && (
          <Badge variant="primary" className="shrink-0">{results.length} kết quả</Badge>
        )}
      </div>

      {/* FOLDER TABS */}
      <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {DEPARTMENTS.map(dept => (
          <button
            key={dept}
            onClick={() => setDepartment(dept === 'Tất cả' ? 'all' : dept)}
            className={clsx(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors border",
              department === (dept === 'Tất cả' ? 'all' : dept)
                ? "bg-primary-600 text-white border-primary-600"
                : "bg-white text-surface-600 border-surface-200 hover:bg-surface-50"
            )}
          >
            {dept} <span className="opacity-70 text-xs">({deptCounts[dept]})</span>
          </button>
        ))}
      </div>

      {/* TYPE FILTER CHIPS */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map(t => {
          const isActive = type === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={clsx(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors border",
                isActive 
                  ? "bg-primary-50 text-primary-700 border-primary-200 font-semibold"
                  : "bg-surface-100 text-surface-600 border-transparent hover:bg-surface-200"
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {t.label}
            </button>
          )
        })}
      </div>

      {/* MULTI-TAB VIEWER */}
      {openTabs.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex overflow-x-auto border-b border-surface-200 gap-1 px-2 pt-2 scrollbar-hide">
            <AnimatePresence mode="popLayout">
              {openTabs.map(tab => {
                const isActive = activeTab === tab.id;
                const TabIcon = ICON_MAP[tab.icon] || FileText;
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      "group flex items-center gap-2 px-3 py-2 rounded-t-xl cursor-pointer border transition-colors shrink-0",
                      isActive 
                        ? "bg-white border-surface-200 border-b-transparent shadow-sm text-surface-900" 
                        : "bg-surface-50 border-transparent border-b-surface-200 text-surface-500 hover:bg-surface-100"
                    )}
                    style={{ marginBottom: isActive ? '-1px' : '0' }}
                  >
                    <TabIcon className={clsx("w-4 h-4 shrink-0", isActive ? "text-primary-600" : "text-surface-400")} />
                    <span className="max-w-[160px] truncate text-sm font-medium">{tab.name}</span>
                    <button 
                      onClick={(e) => closeTab(tab.id, e)}
                      className="p-0.5 rounded hover:bg-surface-200 text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            <div className="px-3 py-2 text-sm text-surface-400 flex items-center shrink-0">
              + Mở thêm
            </div>
          </div>

          {activeDoc && (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_280px]">
              <div className="min-w-0 overflow-hidden bg-white rounded-2xl border border-surface-200 p-6 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", 
                      activeDoc.type === 'PDF' ? 'bg-red-50 text-red-500' :
                      activeDoc.type === 'Excel' ? 'bg-green-50 text-green-600' :
                      activeDoc.type === 'Video' ? 'bg-blue-50 text-blue-500' :
                      'bg-purple-50 text-purple-500'
                    )}>
                      {React.createElement(ICON_MAP[activeDoc.icon] || FileText, { className: "w-6 h-6" })}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-surface-900">{activeDoc.name}</h2>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">{activeDoc.type}</Badge>
                        <Badge variant="default">{activeDoc.department}</Badge>
                        <Badge variant="primary">{activeDoc.version}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={(e) => toggleBookmark(activeDoc.id, e)} className="shrink-0 p-2">
                      <Star className={clsx("w-5 h-5", activeDoc.bookmarked ? "fill-primary-500 text-primary-500" : "text-surface-400")} />
                    </Button>
                    <Button variant="secondary" size="sm" className="hidden sm:flex shrink-0">Chia sẻ</Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      icon={Download} 
                      className="shrink-0" 
                      onClick={() => {
                        if (activeDoc.file_url) {
                          const link = document.createElement('a');
                          link.href = `${API_URL}${activeDoc.file_url}`;
                          link.download = activeDoc.name || 'document';
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        } else {
                          toast.error("File chưa có trên server");
                        }
                      }}
                    >
                      Tải xuống
                    </Button>
                  </div>
                </div>

                <DocumentViewer doc={activeDoc} />
              </div>

              {/* Sidebar */}
              <div className="w-full flex-shrink-0 bg-primary-50/30 rounded-2xl p-4 flex flex-col gap-4">
                <Card padding="sm" className="shadow-none border border-surface-200 bg-white/50">
                  <h3 className="font-bold text-sm text-surface-900 mb-3">Thông tin</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-surface-500">Phòng ban</span><span className="font-semibold text-surface-900">{activeDoc.department}</span></div>
                    <div className="flex justify-between"><span className="text-surface-500">Loại file</span><span className="font-semibold text-surface-900">{activeDoc.type}</span></div>
                    <div className="flex justify-between"><span className="text-surface-500">Phiên bản</span><span className="font-semibold text-surface-900">{activeDoc.version}</span></div>
                    <div className="flex justify-between"><span className="text-surface-500">Cập nhật</span><span className="font-semibold text-surface-900">{formatRelativeTime(activeDoc.updatedAt)}</span></div>
                    <div className="flex justify-between"><span className="text-surface-500">Kích thước</span><span className="font-semibold text-surface-900">{activeDoc.size}</span></div>
                    <div className="flex justify-between"><span className="text-surface-500">Lượt xem</span><span className="font-semibold text-surface-900">{activeDoc.views}</span></div>
                  </div>
                </Card>

                <Card padding="sm" className="shadow-none border border-surface-200 bg-white/50">
                  <h3 className="font-bold text-sm text-surface-900 mb-3">Đối tượng sử dụng</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {activeDoc.audience.map((aud, i) => (
                      <Badge key={i} variant={aud === 'all' ? 'primary' : 'default'} size="sm" className="text-[10px] uppercase">
                        {aud === 'all' ? 'Toàn công ty' : aud}
                      </Badge>
                    ))}
                  </div>
                </Card>

                <Card padding="sm" className="shadow-none border border-surface-200 bg-white/50">
                  <h3 className="font-bold text-sm text-surface-900 mb-3">Lịch sử phiên bản</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div>
                        <div className="flex gap-2 items-center"><span className="text-sm font-semibold text-surface-900">{activeDoc.version}</span><Badge variant="primary" className="px-1 py-0 h-4 text-[9px]">Hiện tại</Badge></div>
                        <p className="text-xs text-surface-500 mt-0.5">{formatRelativeTime(activeDoc.updatedAt)}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-surface-300 mt-1.5 shrink-0" />
                      <div>
                        <div className="flex gap-2 items-center"><span className="text-sm font-medium text-surface-700">v1.0</span></div>
                        <p className="text-xs text-surface-500 mt-0.5">Phiên bản gốc — 3 tháng trước</p>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card padding="sm" className="shadow-none border border-surface-200 bg-white/50">
                  <h3 className="font-bold text-sm text-surface-900 mb-3">Tài liệu liên quan</h3>
                  <div className="space-y-2">
                    {docs.filter(d => d.id !== activeDoc.id && (d.department === activeDoc.department || d.tag === activeDoc.tag)).slice(0,2).map(d => (
                      <div key={d.id} className="flex gap-2 items-center hover:bg-surface-50 p-1.5 -mx-1.5 rounded-lg cursor-pointer transition-colors" onClick={() => openDoc(d)}>
                        {React.createElement(ICON_MAP[d.icon] || FileText, { className: "w-4 h-4 text-surface-400 shrink-0" })}
                        <span className="text-xs font-medium text-surface-700 truncate flex-1">{d.name}</span>
                        <Button variant="ghost" className="px-2 py-1 h-6 text-[10px]" onClick={(e) => { e.stopPropagation(); openDoc(d); }}>Mở</Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DOC LIST */}
      {!activeTab && (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
          <div className="hidden sm:flex px-6 py-3 border-b border-surface-200 bg-surface-50 text-xs font-bold uppercase tracking-wide text-surface-500">
            <div className="flex-1">Tên tài liệu</div>
            <div className="w-32">Phòng ban</div>
            <div className="w-32">Cập nhật</div>
            <div className="w-20">Lượt xem</div>
            <div className="w-24"></div>
          </div>
          
          <div className="flex-1 overflow-auto bg-white">
            <AnimatePresence mode="popLayout">
              {results.length > 0 ? (
                results.map(doc => {
                  const DocIcon = ICON_MAP[doc.icon] || FileText;
                  return (
                    <motion.div 
                      key={doc.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3.5 border-b border-surface-100 hover:bg-surface-50 transition-colors"
                    >
                      <div className="flex-1 flex gap-3 items-center min-w-0">
                        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          doc.type === 'PDF' ? 'bg-red-50 text-red-500' :
                          doc.type === 'Excel' ? 'bg-green-50 text-green-600' :
                          doc.type === 'Video' ? 'bg-blue-50 text-blue-500' :
                          'bg-purple-50 text-purple-500'
                        )}>
                          <DocIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-semibold text-surface-900 line-clamp-1">{doc.name}</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {doc.audience.slice(0,2).map((a, i) => (
                              <span key={i} className="text-[10px] bg-surface-100 text-surface-500 px-1.5 rounded uppercase font-medium">{a==='all' ? 'Toàn công ty' : a}</span>
                            ))}
                            {doc.audience.length > 2 && <span className="text-[10px] text-surface-400">+{doc.audience.length - 2}</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:contents mt-2 sm:mt-0 pl-12 sm:pl-0">
                        <div className="w-32 text-sm text-surface-700 hidden sm:block">
                          <Badge variant="default" className="font-medium bg-surface-100 text-surface-700 hover:bg-surface-200">{doc.department}</Badge>
                        </div>
                        <div className="w-32 text-sm text-surface-500 hidden sm:block">{formatRelativeTime(doc.updatedAt)}</div>
                        <div className="w-20 text-sm text-surface-500 flex items-center gap-1 hidden sm:flex">
                          <Eye className="w-3.5 h-3.5" />
                          {doc.views}
                        </div>
                        
                        <div className="w-full sm:w-24 flex items-center justify-end gap-1 shrink-0">
                          <button onClick={(e) => toggleBookmark(doc.id, e)} className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 transition-colors focus:outline-none">
                            <Star className={clsx("w-4 h-4", doc.bookmarked && "fill-primary-500 text-primary-500")} />
                          </button>
                          <Button variant="primary" size="sm" onClick={() => openDoc(doc)} className="px-3 h-8">Xem</Button>
                          {isAdmin && (
                            <button
                              onClick={(e) => handleDeleteDoc(doc, e)}
                              className="hidden sm:flex p-2 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500 transition-colors focus:outline-none"
                              title="Xoá tài liệu"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 px-4 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center text-surface-400 mb-4">
                    <SearchX className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-surface-900 mb-1">Không tìm thấy tài liệu</h3>
                  <p className="text-surface-500 mb-6">Thử từ khoá khác hoặc thay đổi bộ lọc</p>
                  <Button variant="secondary" onClick={() => { setQuery(''); setDepartment('all'); setType('all'); }}>
                    Xoá bộ lọc
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      <Modal open={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Tải lên tài liệu mới" size="md">
        <div className="space-y-6">
          <div 
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={clsx(
              "border-2 border-dashed rounded-2xl p-10 text-center transition-all",
              dragOver ? "bg-primary-50 border-primary-400 scale-[1.01]" : "border-surface-200 bg-surface-50 hover:bg-surface-100"
            )}
          >
            <Upload className="w-12 h-12 text-primary-500 mx-auto mb-3" />
            <p className="font-bold text-surface-900 text-lg mb-1">Kéo thả file vào đây</p>
            <p className="text-surface-500 text-sm mb-4">hoặc</p>
            <div className="relative inline-block">
              <Button variant="secondary">Chọn từ máy tính</Button>
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }} 
              />
            </div>
            <p className="text-xs text-surface-400 mt-4">Hỗ trợ: PDF, Excel, Video, Word, PowerPoint</p>
            {uploadFile && <p className="mt-3 text-sm font-semibold text-primary-600">Đã chọn: {uploadFile.name}</p>}
          </div>

          {uploadFile && (
            <div className="space-y-4">
              <Input 
                label="Tên tài liệu" 
                value={uploadName} 
                onChange={(e) => setUploadName(e.target.value)} 
                placeholder="Nhập tên tài liệu..."
              />
              
              <div>
                <label className="text-sm font-medium text-surface-700 block mb-1.5">Phòng ban</label>
                <select 
                  value={uploadDept} 
                  onChange={(e) => setUploadDept(e.target.value)}
                  className="w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
                >
                  {DEPARTMENTS.filter(d => d !== 'Tất cả').map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button variant="ghost" onClick={() => setIsUploadOpen(false)}>Huỷ</Button>
            <Button variant="primary" onClick={handleUploadSubmit} disabled={!uploadFile || !uploadName || uploading} loading={uploading}>
              {uploading ? 'Đang tải lên...' : 'Tải lên'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
