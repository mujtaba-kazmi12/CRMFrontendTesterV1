import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
          <Dashboard />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 