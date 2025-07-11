'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PostForm } from '@/components/posts/PostForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function PostEditPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PostForm />
      </DashboardLayout>
    </ProtectedRoute>
  );
} 