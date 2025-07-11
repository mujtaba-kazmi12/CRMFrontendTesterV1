'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UserForm } from '@/components/users/UserForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function NewUserPage() {
  return (
    <ProtectedRoute adminOnly>
      <DashboardLayout>
        <UserForm />
      </DashboardLayout>
    </ProtectedRoute>
  );
} 