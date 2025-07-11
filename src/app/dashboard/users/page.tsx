'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UsersList } from '@/components/users/UsersList';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function UsersPage() {
  return (
    <ProtectedRoute adminOnly>
      <DashboardLayout>
        <UsersList />
      </DashboardLayout>
    </ProtectedRoute>
  );
} 