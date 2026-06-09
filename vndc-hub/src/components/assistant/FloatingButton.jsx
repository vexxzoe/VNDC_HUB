import React from 'react';
import { Bot } from 'lucide-react';
import { clsx } from 'clsx';

export default function FloatingButton({ onClick, hasUnread }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      <button
        onClick={onClick}
        className="w-14 h-14 rounded-full bg-primary-600 shadow-xl hover:bg-primary-700 hover:scale-105 transition-all flex items-center justify-center relative"
      >
        <Bot className="w-6 h-6 text-white" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
            1
          </span>
        )}
      </button>
      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
        Trợ lý AI · Claude Sonnet
      </div>
    </div>
  );
}
