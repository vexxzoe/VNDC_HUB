import React, { createContext, useContext, useState, useEffect } from 'react';
import { MODULES } from '@/data/mockData';

const LearningContext = createContext(null);

export function LearningProvider({ children }) {
  const [modules, setModules] = useState(() => {
    try {
      const saved = localStorage.getItem('vndc_learning');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error parsing vndc_learning", e);
    }
    return MODULES;
  });

  useEffect(() => {
    localStorage.setItem('vndc_learning', JSON.stringify(modules));
  }, [modules]);

  const updateProgress = (moduleId, newProgress) => {
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, progress: Math.min(Math.max(newProgress, 0), 100) } : m));
  };

  const toggleComplete = (moduleId) => {
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, progress: m.progress === 100 ? 0 : 100 } : m));
  };

  const updateQuizScore = (moduleId, score) => {
    setModules(prev => prev.map(m =>
      m.id === moduleId ? { ...m, quizScore: score } : m
    ));
  };

  const getModuleById = (id) => modules.find(m => m.id === id);

  return (
    <LearningContext.Provider value={{ modules, updateProgress, toggleComplete, updateQuizScore, getModuleById }}>
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
}
