import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { AnimatePresence, motion } from 'framer-motion';
import { AssistantPanel, FloatingButton } from '@/components/assistant';
import { clsx } from 'clsx';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-[var(--color-bg)]">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-surface-950/40 backdrop-blur-sm lg:hidden"
          />
        )}
        {assistantOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAssistantOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm sm:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className={clsx(
          "flex-1 overflow-auto bg-[var(--color-bg)] relative p-4 sm:p-6 lg:p-8 transition-all duration-300",
          assistantOpen && "sm:mr-[380px]"
        )}>
          {children}
        </main>
      </div>

      <AnimatePresence>
        {assistantOpen && (
          <AssistantPanel
            open={assistantOpen}
            onClose={() => setAssistantOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {!assistantOpen && (
        <FloatingButton
          onClick={() => setAssistantOpen(true)}
          hasUnread={false}
        />
      )}
    </div>
  );
}
