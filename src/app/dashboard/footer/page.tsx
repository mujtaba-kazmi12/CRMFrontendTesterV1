'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import FooterSettingsPage from '@/components/settings/FooterSettingsPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function FooterPage() {
  return (
    <ProtectedRoute adminOnly>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Footer Settings</h1>
            <p className="text-muted-foreground">
              Configure your website footer content and links.
            </p>
          </div>
          <FooterSettingsPage />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 