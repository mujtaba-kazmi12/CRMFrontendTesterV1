'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CategoriesList } from '@/components/posts/CategoriesList';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function CategoriesPage() {
  return (
    <ProtectedRoute adminOnly>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <p className="text-muted-foreground">
              Manage your content categories and subcategories.
            </p>
          </div>
          <CategoriesList />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 