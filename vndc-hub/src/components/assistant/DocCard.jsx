import React from 'react';
import { ExternalLink, Sparkles, FileText, Table2, Video, BookOpen } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { clsx } from 'clsx';

const FILE_ICONS = { PDF: FileText, Excel: Table2, Video: Video, Module: BookOpen };
const FILE_COLORS = { 
  PDF: 'text-red-500 bg-red-50', 
  Excel: 'text-green-600 bg-green-50', 
  Video: 'text-blue-500 bg-blue-50', 
  Module: 'text-purple-600 bg-purple-50' 
};

export default function DocCard({ doc, onNavigate, onSummary }) {
  const Icon = FILE_ICONS[doc.type] || FileText;

  return (
    <div className="bg-white border border-surface-200 rounded-xl p-3 hover:shadow-md cursor-pointer transition-shadow mt-2">
      <div className="flex gap-3 items-start">
        <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', FILE_COLORS[doc.type] || FILE_COLORS.PDF)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm text-surface-900 line-clamp-1">{doc.name}</p>
            <Badge variant="surface" className="text-[10px] shrink-0 px-1 py-0">{doc.type}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-[10px] px-1 py-0">{doc.department}</Badge>
            <span className="text-xs text-surface-400 font-medium">{doc.version}</span>
            <span className="text-xs text-surface-400 font-medium shrink-0 ml-auto">{doc.views} views</span>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 mt-3 pt-3 border-t border-surface-100">
        <Button variant="primary" size="sm" icon={ExternalLink} onClick={() => onNavigate(doc)} className="flex-1 justify-center text-[11px] h-7">
          Xem
        </Button>
        <Button variant="secondary" size="sm" icon={Sparkles} onClick={() => onSummary(doc)} className="flex-1 justify-center text-[11px] h-7">
          Tóm tắt
        </Button>
      </div>
    </div>
  );
}
