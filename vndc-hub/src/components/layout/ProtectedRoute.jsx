import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldOff } from 'lucide-react';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface-50 text-surface-900 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-card text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldOff className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Truy cập bị từ chối</h2>
          <p className="text-surface-500">
            Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
