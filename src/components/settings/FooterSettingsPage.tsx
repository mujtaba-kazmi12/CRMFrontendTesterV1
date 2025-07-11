'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { api } from '../../lib/api';

export default function FooterSettingsPage() {
  const [footerContent, setFooterContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchFooter = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('crm_token');
        const data = await api.get('/settings/footer', token || undefined);
        setFooterContent(data.footerContent || '');
      } catch (err) {
        setError('Failed to load footer content');
      } finally {
        setLoading(false);
      }
    };
    fetchFooter();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const token = localStorage.getItem('crm_token');
      // Try PUT first, fallback to POST if fails
      try {
        await api.put('/settings/footer', { footerContent }, token || undefined);
      } catch {
        await api.post('/settings/footer', { footerContent }, token || undefined);
      }
      setSuccess(true);
    } catch (err) {
      setError('Failed to save footer content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-12 shadow-lg">
      <CardHeader>
        <CardTitle>Footer Content</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <label className="font-semibold text-zinc-700 dark:text-zinc-200">Footer Text</label>
          <Textarea
            value={footerContent}
            onChange={e => setFooterContent(e.target.value)}
            rows={6}
            placeholder="Enter your footer content here..."
            className="resize-y border rounded p-3 text-base shadow-sm focus:ring-2 focus:ring-indigo-500"
            required
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">Footer content saved!</div>}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="px-6 py-2 text-base font-semibold">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 