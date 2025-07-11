'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TagsList } from '@/components/posts/TagsList';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function TagsPage() {
  return (
    <ProtectedRoute adminOnly>
      <DashboardLayout>
        <div className="space-y-6">
         
          <TagsList />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 