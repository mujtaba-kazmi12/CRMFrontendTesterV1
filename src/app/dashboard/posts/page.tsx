'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PostsList } from '@/components/posts/PostsList';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function PostsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PostsList />
      </DashboardLayout>
    </ProtectedRoute>
  );
} 