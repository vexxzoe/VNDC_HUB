import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/utils/api';
import DocCard from './DocCard';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  Bot, RotateCcw, Bookmark, X, Copy, XCircle, Send, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';



const QUICK_CHIPS = [
  "Tìm tài liệu đổi trả",
  "Module nào phù hợp với tôi?",
  "Quy trình bảo hành",
  "Bảng giá mới nhất",
  "Hướng dẫn onboarding",
  "KPI phòng CSKH",
];

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'bot',
  text: null,
  type: 'welcome',
  timestamp: new Date().toISOString(),
};



export default function AssistantPanel({ open, onClose }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  
  const initialSaved = JSON.parse(localStorage.getItem('vndc_saved_answers') || '[]');
  const [savedAnswers, setSavedAnswers] = useState(initialSaved);

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    localStorage.setItem('vndc_saved_answers', JSON.stringify(savedAnswers));
  }, [savedAnswers]);



  const handleSend = async (text = input) => {
    const trimmed = (typeof text === 'string' ? text : input).trim();
    if (!trimmed || isTyping) return;

    const userMsg = {
      id: Date.now() + 'u', role: 'user', type: 'text',
      text: trimmed, timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    if (input === trimmed || text === input) setInput('');
    setIsTyping(true);

    const historyForAPI = conversationHistory.slice(-20);

    try {
      const result = await api.chat(trimmed, historyForAPI);

      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: trimmed },
        { role: 'model', content: result.text },
      ].slice(-20));

      setMessages(prev => [...prev, {
        id: Date.now() + 'b', role: 'bot',
        type: result.docs?.length > 0 ? 'doc_result' : 'text',
        text: result.text,
        docs: result.docs || [],
        timestamp: new Date().toISOString(),
      }]);
    } catch (err) {
      let errorText = 'Có lỗi xảy ra. Vui lòng thử lại.';
      if (err.message?.includes('bận') || err.message === 'RATE_LIMIT')
        errorText = 'AI đang bận. Vui lòng thử lại sau 10 giây.';
      setMessages(prev => [...prev, {
        id: Date.now() + 'e', role: 'bot', type: 'error',
        text: errorText, retryText: trimmed,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép");
  };

  const handleSave = (msg) => {
    setSavedAnswers(prev => [{ id: msg.id, text: msg.text, time: new Date().toISOString() }, ...prev].slice(0, 20));
    toast.success("Đã lưu câu trả lời");
  };

  const removeSaved = (id) => {
    setSavedAnswers(prev => prev.filter(a => a.id !== id));
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: open ? 0 : 400 }}
      transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
      className="fixed right-0 top-0 h-screen w-full sm:w-[380px] z-40 bg-white border-l border-surface-200 shadow-card-lg flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 bg-white sticky top-0 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-primary-600" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-surface-900">Trợ lý AI VNDC</h3>
            <p className="text-xs text-green-600 font-medium">Trực tuyến · Llama 3.3</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => { setMessages([WELCOME_MESSAGE]); setConversationHistory([]); toast.info("Đã xoá lịch sử"); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-100 transition-colors" title="Xoá chat">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={() => setSavedOpen(!savedOpen)} className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-100 transition-colors" title="Câu đã lưu">
            <Bookmark className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-100 transition-colors" title="Đóng">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 relative">
        {messages.map(msg => {
          if (msg.type === 'welcome') {
            return (
              <div key={msg.id} className="flex gap-2 items-start">
                <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary-600" />
                </div>
                <div className="bg-primary-50 rounded-2xl rounded-tl-sm p-4 text-surface-900">
                  <Bot className="w-6 h-6 text-primary-600 mb-2" />
                  <p className="font-bold text-sm mb-1">Xin chào {user?.name}! 👋</p>
                  <p className="text-sm font-medium mb-3 leading-relaxed">Tôi là trợ lý AI của VNDC HUB. Tôi có thể giúp bạn:</p>
                  <ul className="flex flex-col gap-1.5 text-sm font-medium">
                    <li>🔍 Tìm tài liệu theo từ khoá</li>
                    <li>📚 Gợi ý module học phù hợp</li>
                    <li>📋 Hướng dẫn quy trình nội bộ</li>
                    <li>❓ Trả lời câu hỏi về nghiệp vụ</li>
                  </ul>
                  <p className="text-sm text-surface-500 mt-3 font-medium">Hỏi tôi bất cứ điều gì!</p>
                </div>
              </div>
            );
          }

          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  <p className="text-[10px] text-white/60 font-medium text-right mt-1.5">{formatTime(msg.timestamp)}</p>
                </div>
              </div>
            );
          }

          if (msg.role === 'bot') {
            return (
              <div key={msg.id} className="flex gap-2 items-start">
                <div className="w-7 h-7 bg-primary-50 rounded-full flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-primary-600" />
                </div>
                <div className="bg-primary-50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] text-surface-900">
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  
                  {msg.docs && msg.docs.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-bold text-primary-600 mb-2">Tài liệu liên quan:</p>
                      <div className="flex flex-col gap-2">
                        {msg.docs.map(doc => (
                          <DocCard 
                            key={doc.id} 
                            doc={doc} 
                            onNavigate={(d) => { navigate('/library'); toast.info("Mở: " + d.name); }} 
                            onSummary={(d) => handleSend("Tóm tắt ngắn gọn tài liệu: " + d.name)} 
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-1.5 mt-3">
                    <button onClick={() => handleCopy(msg.text)} className="flex items-center gap-1 px-2 py-1 hover:bg-primary-100 rounded text-[10px] font-bold text-surface-500 transition-colors">
                      <Copy className="w-3 h-3" /> Sao chép
                    </button>
                    <button onClick={() => handleSave(msg)} className="flex items-center gap-1 px-2 py-1 hover:bg-primary-100 rounded text-[10px] font-bold text-surface-500 transition-colors">
                      <Bookmark className="w-3 h-3" /> Lưu
                    </button>
                  </div>
                  <p className="text-[10px] text-surface-400 font-medium mt-1.5">{formatTime(msg.timestamp)}</p>
                </div>
              </div>
            );
          }

          if (msg.type === 'error') {
            return (
              <div key={msg.id} className="flex gap-2 items-start">
                <div className="w-7 h-7 bg-red-50 rounded-full flex items-center justify-center shrink-0 mt-1">
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                  <p className="text-sm font-medium text-red-700 leading-relaxed mb-2">{msg.text}</p>
                  {msg.retryText && (
                    <button onClick={() => handleSend(msg.retryText)} className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">
                      ↺ Thử lại
                    </button>
                  )}
                </div>
              </div>
            );
          }

          return null;
        })}

        {isTyping && (
          <div className="flex gap-2 items-start">
            <div className="w-7 h-7 bg-primary-50 rounded-full flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-3.5 h-3.5 text-primary-600" />
            </div>
            <div className="bg-primary-50 rounded-2xl rounded-tl-sm px-4 py-4 flex gap-1">
              {[0, 0.15, 0.3].map(delay => (
                <motion.div
                  key={delay}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay }}
                  className="w-1.5 h-1.5 rounded-full bg-primary-400"
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2 shrink-0" />

      </div>

      {/* Quick Chips */}
      <div className="shrink-0 border-t border-surface-100 overflow-x-auto scrollbar-hide py-2 px-4 flex gap-2">
        {QUICK_CHIPS.map(chip => (
          <button
            key={chip}
            onClick={() => handleSend(chip)}
            className="flex-shrink-0 bg-surface-100 hover:bg-primary-50 text-surface-600 hover:text-primary-700 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="shrink-0 p-3 bg-white border-t border-surface-200 flex items-end gap-2 relative">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi về tài liệu, quy trình..."
            className="w-full min-h-[44px] max-h-[120px] rounded-2xl border border-surface-200 px-4 py-2.5 text-sm font-medium focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none resize-none bg-surface-50 focus:bg-white transition-all scrollbar-hide"
            rows={1}
          />
          {input.length > 50 && (
            <div className="absolute right-3 -top-5 text-[10px] font-semibold text-surface-400 bg-white px-1">
              {input.length}/500
            </div>
          )}
        </div>
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isTyping}
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors bg-primary-600 text-white hover:bg-primary-700 disabled:bg-surface-200 disabled:text-surface-400 mb-0.5"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </div>

      {/* Saved Panel Overlay */}
      <AnimatePresence>
        {savedOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-10 bg-white flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 shrink-0">
              <span className="font-semibold text-sm text-surface-900">Câu trả lời đã lưu</span>
              <button
                onClick={() => setSavedOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {savedAnswers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-surface-400">
                  <Bookmark size={32} strokeWidth={1.5} />
                  <p className="text-sm font-medium">Chưa có câu trả lời được lưu</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {savedAnswers.map(item => (
                    <div key={item.id} className="border border-surface-200 rounded-xl p-3 group hover:border-surface-300 transition-colors">
                      <p className="text-sm font-medium text-surface-800 line-clamp-3 leading-relaxed mb-2">{item.text}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-surface-400">{formatTime(item.time)}</span>
                        <button
                          onClick={() => removeSaved(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded flex items-center justify-center text-surface-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
