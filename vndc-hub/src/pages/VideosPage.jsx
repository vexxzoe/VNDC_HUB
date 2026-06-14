import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Badge, Button } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Eye, Clock, Share2, Play, CheckCircle2, Download } from 'lucide-react';
import { api } from '@/utils/api';

const VIDEOS_FALLBACK = [
  { id:"v1", title:"Onboarding nhân viên mới",         duration:"12:34", dept:"Chung",       thumb:"👋", views:210, tag:"onboarding" },
  { id:"v2", title:"Hướng dẫn sử dụng CRM",            duration:"08:45", dept:"Kinh doanh",  thumb:"💻", views:134, tag:"crm" },
  { id:"v3", title:"Kỹ năng xử lý khiếu nại",          duration:"15:20", dept:"CSKH",        thumb:"🎧", views:98,  tag:"cskh" },
  { id:"v4", title:"Quy trình kiểm tra kỹ thuật",       duration:"20:10", dept:"Kỹ thuật",    thumb:"🔧", views:76,  tag:"kyThuat" },
  { id:"v5", title:"Kỹ năng bán hàng nâng cao",         duration:"18:05", dept:"Kinh doanh",  thumb:"📈", views:89,  tag:"sales" },
  { id:"v6", title:"An toàn thông tin nội bộ",          duration:"10:30", dept:"Chung",       thumb:"🔒", views:145, tag:"security" },
  { id:"v7", title:"Hướng dẫn báo cáo tháng",          duration:"06:15", dept:"Vận hành",    thumb:"📊", views:67,  tag:"report" },
  { id:"v8", title:"Team building & văn hoá công ty",  duration:"25:00", dept:"Chung",       thumb:"🤝", views:188, tag:"culture" },
];

const DEPARTMENTS = ['Tất cả', 'Chung', 'Kinh doanh', 'CSKH', 'Kỹ thuật'];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Component tạo thumbnail từ video bằng Canvas API
// Dùng thuộc tính crossOrigin + toDataURL để capture frame mà không bị IDM can thiệp
function VideoThumb({ fileUrl }) {
  const canvasRef = React.useRef(null);
  const [captured, setCaptured] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!fileUrl) return;
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';
    // Dùng .stream để tránh IDM bắt
    video.src = `${API_BASE}${fileUrl.replace(/\.(mp4|webm)$/i, '.stream')}`;

    video.addEventListener('loadeddata', () => {
      video.currentTime = 1.5;
    });
    video.addEventListener('seeked', () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 180;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setCaptured(true);
      video.src = '';
      video.load();
    });
    video.addEventListener('error', () => setFailed(true));
    video.load();
    return () => { video.src = ''; video.load(); };
  }, [fileUrl]);

  if (failed) return <span className="text-2xl">🎬</span>;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{ display: captured ? 'block' : 'none' }}
      />
      {!captured && (
        <span className="text-2xl">🎬</span>
      )}
    </>
  );
}


export default function VideosPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [filterDept, setFilterDept] = useState('Tất cả');
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    setVideoError(false);
  }, [selectedVideo]);

  useEffect(() => {
    api.getDocuments({ type: 'Video' })
      .then(data => {
        const apiVideos = data.documents || []
        if (apiVideos.length > 0) {
          const converted = apiVideos.map(doc => ({
            id: doc.id,
            title: doc.name || doc.id || 'Video không tên',
            duration: '—',
            dept: doc.department,
            thumb: '🎬',
            views: doc.views || 0,
            tag: doc.tag || '',
            file_url: doc.file_url,
          }))
          setVideos(converted)
        } else {
          setVideos(VIDEOS_FALLBACK)
        }
      })
      .catch(() => {
        setVideos(VIDEOS_FALLBACK)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (videos.length > 0 && !selectedVideo) {
      setSelectedVideo(videos[0])
    }
  }, [videos])
  
  const [watched, setWatched] = useState(() => {
    try {
      const saved = localStorage.getItem('vndc_watched');
      return new Set(JSON.parse(saved || '[]'));
    } catch (e) {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem('vndc_watched', JSON.stringify(Array.from(watched)));
  }, [watched]);



  const toggleWatched = () => {
    setWatched(prev => {
      const next = new Set(prev);
      if (next.has(selectedVideo.id)) {
        next.delete(selectedVideo.id);
        toast.info('Đã bỏ đánh dấu đã xem');
      } else {
        next.add(selectedVideo.id);
        toast.success('Đã đánh dấu đã xem video');
      }
      return next;
    });
  };

  const filteredVideos = (videos || []).filter(v => filterDept === 'Tất cả' || v.dept === filterDept);
  
  const relatedVideos = (videos || []).filter(v => 
    selectedVideo && v.id !== selectedVideo.id && 
    (v.dept === selectedVideo.dept || v.tag === selectedVideo.tag)
  ).slice(0, 4);

  const pct = Math.round((watched.size / (videos.length || 1)) * 100) || 0;

  if (loading || !selectedVideo) return (
    <div className="p-8 text-center text-slate-400">
      Đang tải video...
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-5">
      {/* PLAYER AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold text-surface-900">Video đào tạo</h1>
          <Badge variant="default">{selectedVideo.dept}</Badge>
        </div>

        {selectedVideo ? (
          <div className="relative bg-slate-900 rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {selectedVideo.file_url ? (
              videoError ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white">
                  <span className="text-5xl">⚠️</span>
                  <p className="font-medium">Không thể tải video</p>
                  <p className="text-white/50 text-sm">File không tồn tại trên server</p>
                  <a href={`http://localhost:3001${selectedVideo.file_url}`} target="_blank" rel="noreferrer" className="text-primary-400 text-sm underline">
                    Thử mở trực tiếp
                  </a>
                </div>
              ) : (
                <video
                  key={selectedVideo.id}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay={false}
                  preload="metadata"
                  poster=""
                  onEnded={() => {
                    if (!watched.has(selectedVideo.id)) {
                      toggleWatched();
                    }
                  }}
                  onError={() => setVideoError(true)}
                  onLoadStart={() => setVideoError(false)}
                >
                  <source src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${selectedVideo.file_url.replace(/\.mp4$/i, '.stream')}`} type="video/mp4" />
                  <source src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${selectedVideo.file_url.replace(/\.webm$/i, '.stream')}`} type="video/webm" />
                  Trình duyệt không hỗ trợ video này.
                </video>
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white">
                <span className="text-6xl">{selectedVideo.thumb || '🎬'}</span>
                <p className="font-bold text-lg">{selectedVideo?.title || selectedVideo?.name || 'Video'}</p>
                <p className="text-white/50 text-sm">Video demo — chưa có file thật</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 rounded-2xl flex items-center justify-center text-white/40" style={{ aspectRatio: '16/9' }}>
            Chọn video để xem
          </div>
        )}

        {/* Video info bar */}
        <div className="mt-5 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h2 className="font-bold text-lg text-surface-900">{selectedVideo?.title || selectedVideo?.name || 'Video'}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-surface-500 font-medium">
              <Badge variant="default" className="text-[11px]">{selectedVideo.dept}</Badge>
              <div className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {selectedVideo.views} lượt xem</div>
              <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {selectedVideo.duration || '—'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedVideo?.file_url && (
              <a
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${selectedVideo.file_url}`}
                download={selectedVideo.title}
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface-100 hover:bg-surface-200 rounded-xl text-surface-700 text-sm font-semibold transition-colors"
              >
                <Download size={16} />
                Tải xuống
              </a>
            )}
            <Button variant="ghost" icon={Share2} onClick={() => toast.success("Đã sao chép link!")}>Chia sẻ</Button>
            {watched.has(selectedVideo.id) ? (
              <Button variant="ghost" className="text-green-700 bg-green-50 hover:bg-green-100 border-none" icon={CheckCircle2} onClick={toggleWatched}>
                Đã xem
              </Button>
            ) : (
              <Button variant="secondary" onClick={toggleWatched}>
                Đánh dấu đã xem
              </Button>
            )}
          </div>
        </div>

        {/* Related videos */}
        {relatedVideos.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-surface-900 mb-4">Video liên quan</h3>
            <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2 -mx-6 px-6 lg:mx-0 lg:px-0">
              {relatedVideos.map(v => (
                <div 
                  key={v.id} 
                  onClick={() => setSelectedVideo(v)}
                  className="w-48 flex-shrink-0 bg-white border border-surface-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-card transition-all hover:-translate-y-0.5 relative group"
                >
                  <div className="h-28 bg-slate-800 flex items-center justify-center text-4xl relative overflow-hidden">
                    {v.thumb}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-surface-900 line-clamp-2 mb-1.5 leading-snug">{v.title}</p>
                    <p className="text-xs text-surface-500 font-medium">{v.duration || '—'}</p>
                  </div>
                  {watched.has(v.id) && (
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-slate-800" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PLAYLIST SIDEBAR */}
      <div className="w-full lg:w-80 flex-shrink-0 bg-white border border-surface-200 rounded-2xl overflow-hidden lg:sticky lg:top-20 h-fit flex flex-col max-h-[800px] shadow-sm">
        <div className="px-4 py-3 border-b border-surface-100 bg-surface-50 flex items-center justify-between">
          <h3 className="font-semibold text-surface-900">Danh sách phát</h3>
          <Badge variant="primary" className="bg-primary-50 text-primary-700">{watched.size}/{videos.length} đã xem</Badge>
        </div>

        <div className="px-3 py-3 flex gap-1.5 flex-wrap border-b border-surface-100 bg-white">
          {DEPARTMENTS.map(d => (
            <button
              key={d}
              onClick={() => setFilterDept(d)}
              className={clsx(
                "px-2.5 py-1 text-[11px] font-semibold rounded-full transition-colors",
                filterDept === d ? "bg-primary-600 text-white" : "bg-surface-100 text-surface-600 hover:bg-surface-200"
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto flex-1 min-h-[140px] lg:min-h-[300px] scrollbar-hide bg-white">
          {filteredVideos.map(v => {
            const isActive = v.id === selectedVideo.id;
            return (
              <div 
                key={v.id} 
                onClick={() => setSelectedVideo(v)}
                className={clsx(
                  "flex gap-3 px-4 py-3 cursor-pointer lg:border-b border-surface-50 hover:bg-surface-50 transition-colors w-72 lg:w-auto flex-shrink-0 lg:flex-shrink",
                  isActive && "bg-primary-50 lg:border-l-2 lg:border-t-0 border-b-2 lg:border-b-primary-50 border-primary-600"
                )}
              >
                <div className="w-20 h-12 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 relative overflow-hidden text-2xl">
                  {v.file_url ? (
                    <VideoThumb fileUrl={v.file_url} />
                  ) : (
                    v.thumb || '🎬'
                  )}
                  {watched.has(v.id) && (
                    <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center text-white backdrop-blur-[1px]">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className={clsx("text-sm font-semibold line-clamp-2 leading-snug", isActive ? "text-primary-700" : "text-surface-900")}>
                    {v.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4">{v.dept}</Badge>
                    <span className="text-xs text-surface-500 font-medium">{v.duration || '—'}</span>
                  </div>
                </div>
              </div>
            )
          })}
          {filteredVideos.length === 0 && (
            <div className="p-8 text-center text-surface-500 text-sm font-medium w-full">Không có video nào.</div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-surface-100 bg-surface-50 lg:block hidden">
          <p className="text-xs text-surface-500 font-semibold mb-2">Tiến độ khoá học</p>
          <div className="h-1.5 w-full bg-surface-200 rounded-full overflow-hidden mb-1.5">
            <div className="h-full bg-primary-500 transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[11px] text-surface-600 font-bold">{pct}% hoàn thành</p>
        </div>
      </div>
    </div>
  );
}
