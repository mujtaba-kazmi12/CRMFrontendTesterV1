'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function Settings() {
  return (
    <ProtectedRoute adminOnly>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Configure your CRM application settings.
            </p>
          </div>
          <SettingsPage />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 