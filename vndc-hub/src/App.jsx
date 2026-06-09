import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LearningProvider } from '@/context/LearningContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import LoginPage from '@/pages/LoginPage';

// Placeholders
import DashboardPage from '@/pages/DashboardPage';
import LibraryPage from '@/pages/LibraryPage';
import CoursesPage from '@/pages/CoursesPage';
import QuizPage from '@/pages/QuizPage';
import VideosPage from '@/pages/VideosPage';
import FormsPage from '@/pages/FormsPage';
import UpdatesPage from '@/pages/UpdatesPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import AccessPage from '@/pages/AccessPage';
import PeoplePage from '@/pages/PeoplePage';
import SettingsPage from '@/pages/SettingsPage';
import ProgressPage from '@/pages/ProgressPage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <LearningProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
                <Route path="/library" element={<ProtectedRoute><Layout><LibraryPage /></Layout></ProtectedRoute>} />
                <Route path="/courses" element={<ProtectedRoute><Layout><CoursesPage /></Layout></ProtectedRoute>} />
                <Route path="/quiz" element={<ProtectedRoute><Layout><QuizPage /></Layout></ProtectedRoute>} />
                <Route path="/videos" element={<ProtectedRoute><Layout><VideosPage /></Layout></ProtectedRoute>} />
                <Route path="/forms" element={<ProtectedRoute><Layout><FormsPage /></Layout></ProtectedRoute>} />
                <Route path="/updates" element={<ProtectedRoute><Layout><UpdatesPage /></Layout></ProtectedRoute>} />
                <Route path="/progress" element={<ProtectedRoute><Layout><ProgressPage /></Layout></ProtectedRoute>} />
                
                <Route path="/analytics" element={<ProtectedRoute adminOnly><Layout><AnalyticsPage /></Layout></ProtectedRoute>} />
                <Route path="/access" element={<ProtectedRoute adminOnly><Layout><AccessPage /></Layout></ProtectedRoute>} />
                
                <Route path="/people" element={<ProtectedRoute><Layout><PeoplePage /></Layout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
                
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </LearningProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
