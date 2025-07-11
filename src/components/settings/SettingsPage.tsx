'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  logoUrl: string;
  faviconUrl: string;
  enableRegistration: boolean;
  defaultUserRole: string;
  postsPerPage: number;
  dateFormat: string;
  timeFormat: string;
  emailNotifications: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  customCss: string;
  customJs: string;
  googleAnalyticsId: string;
  recaptchaSiteKey: string;
  recaptchaSecretKey: string;
  contactEmail: string;
  title: string;
  description: string;
  author: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogImage: string;
  ogImageWidth: string;
  ogImageHeight: string;
  ogImageAlt: string;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  defaultMetaKeywords: string;
  facebookUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
  googleTagManagerId: string;
  facebookPixelId: string;
  privateKey: string;
  clientEmail: string;
}

export function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const token = localStorage.getItem('crm_token');
  
  // SEO state
  const [seo, setSeo] = useState<any>(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);
  const [seoSaving, setSeoSaving] = useState(false);
  const seoLoadedRef = useRef(false);
  
  // Analytics state
  const [analytics, setAnalytics] = useState<{ privateKey: string; clientEmail: string }>({ privateKey: '', clientEmail: '' });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analyticsSaving, setAnalyticsSaving] = useState(false);
  const analyticsLoadedRef = useRef(false);
  
  // Bing Indexing state
  const [bing, setBing] = useState<{ apiKey: string; siteUrl: string }>({ apiKey: '', siteUrl: '' });
  const [bingLoading, setBingLoading] = useState(false);
  const [bingSaving, setBingSaving] = useState(false);
  const [bingError, setBingError] = useState<string | null>(null);
  const bingLoadedRef = useRef(false);
  
  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await api.get('/settings', token || undefined);
        setSettings(data);
      } catch (err) {
        setError('Failed to load settings');
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [token]);
  
  // Load SEO meta tags when SEO tab is selected
  useEffect(() => {
    if (activeTab === 'seo' && !seoLoadedRef.current) {
      setSeoLoading(true);
      setSeoError(null);
      api.get('/meta-tags/home', token || undefined)
        .then((res) => {
          let data = res.data || {};
          if (!data) {
            data = {
              title: '',
              description: '',
              author: '',
              keywords: '',
              ogTitle: '',
              ogDescription: '',
              ogUrl: '',
              ogImage: '',
              ogImageWidth: '',
              ogImageHeight: '',
              ogImageAlt: '',
              ogType: '',
              twitterCard: '',
              twitterTitle: '',
              twitterDescription: '',
              twitterImage: '',
              canonicalUrl: '',
              robots: '',
            };
          }
          setSeo({
            ...data,
            keywords: Array.isArray(data.keywords) ? data.keywords.join(', ') : (data.keywords || ''),
            ogImageWidth: data.ogImageWidth ? String(data.ogImageWidth) : '',
            ogImageHeight: data.ogImageHeight ? String(data.ogImageHeight) : '',
          });
          seoLoadedRef.current = true;
        })
        .catch((err) => {
          setSeoError('Failed to load meta tags');
          setSeo({
            title: '',
            description: '',
            author: '',
            keywords: '',
            ogTitle: '',
            ogDescription: '',
            ogUrl: '',
            ogImage: '',
            ogImageWidth: '',
            ogImageHeight: '',
            ogImageAlt: '',
            ogType: '',
            twitterCard: '',
            twitterTitle: '',
            twitterDescription: '',
            twitterImage: '',
            canonicalUrl: '',
            robots: '',
          });
        })
        .finally(() => setSeoLoading(false));
    }
  }, [activeTab, token]);
  
  // Load analytics credentials when Analytics tab is selected
  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsLoadedRef.current) {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      api.get('/google-data', token || undefined)
        .then((data) => {
          setAnalytics({
            privateKey: data.private_key || '',
            clientEmail: data.client_email || '',
          });
          analyticsLoadedRef.current = true;
        })
        .catch((err) => {
          setAnalyticsError('Failed to load Google Indexing credentials');
          setAnalytics({ privateKey: '', clientEmail: '' });
        })
        .finally(() => setAnalyticsLoading(false));
    }
  }, [activeTab, token]);
  
  // Load Bing Indexing data when Bing tab is selected
  useEffect(() => {
    if (activeTab === 'bing' && !bingLoadedRef.current) {
      setBingLoading(true);
      setBingError(null);
      api.get('/bing-indexing', token || undefined)
        .then((data) => {
          setBing({
            apiKey: data.bingApiKey || '',
            siteUrl: data.bingSiteUrl || '',
          });
          bingLoadedRef.current = true;
        })
        .catch((err) => {
          setBingError('Failed to load Bing Indexing data');
          setBing({ apiKey: '', siteUrl: '' });
        })
        .finally(() => setBingLoading(false));
    }
  }, [activeTab, token]);
  
  // Handle SEO field changes
  const handleSeoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSeo((prev: any) => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'seo') {
      setSeoSaving(true);
      setSeoError(null);
      try {
        const payload = {
          ...seo,
          keywords: typeof seo.keywords === 'string' ? seo.keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : [],
          ogImageWidth: seo.ogImageWidth ? Number(seo.ogImageWidth) : undefined,
          ogImageHeight: seo.ogImageHeight ? Number(seo.ogImageHeight) : undefined,
        };
        await api.post('/meta-tags/home', payload, token || undefined);
      } catch (err) {
        setSeoError('Failed to save meta tags');
        console.error('Error saving meta tags:', err);
      } finally {
        setSeoSaving(false);
      }
      return;
    }
    if (activeTab === 'analytics') {
      setAnalyticsSaving(true);
      setAnalyticsError(null);
      try {
        await api.post('/google-data', {
          client_email: analytics.clientEmail,
          private_key: analytics.privateKey,
        }, token || undefined);
      } catch (err) {
        setAnalyticsError('Failed to save Google Indexing credentials');
        console.error('Error saving Google Indexing credentials:', err);
      } finally {
        setAnalyticsSaving(false);
      }
      return;
    }
    if (activeTab === 'bing') {
      setBingSaving(true);
      setBingError(null);
      try {
        await api.post('/bing-indexing', {
          bingApiKey: bing.apiKey,
          bingSiteUrl: bing.siteUrl,
        }, token || undefined);
      } catch (err) {
        setBingError('Failed to save Bing Indexing data');
      } finally {
        setBingSaving(false);
      }
      return;
    }
    if (!settings) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await api.put('/settings', settings, token || undefined);
      // Show success message or notification
    } catch (err) {
      setError('Failed to save settings');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!settings) return;
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value,
    });
  };

  // Handle select changes
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!settings) return;
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value,
    });
  };
  
  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [name]: checked,
    });
  };
  
  // Handle number input changes
  const handleNumberChange = (name: string, value: string) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [name]: parseInt(value, 10) || 0,
    });
  };

  // Handle analytics field changes
  const handleAnalyticsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAnalytics((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle Bing Indexing field changes
  const handleBingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBing((prev) => ({ ...prev, [name]: value }));
  };
  
  if (loading) {
    return <div className="flex justify-center p-8">Loading settings...</div>;
  }
  
  if (!settings) {
    return <div className="p-4 text-red-500 bg-red-50 rounded-md">Failed to load settings</div>;
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres du Site</CardTitle>
          <CardDescription>
            Gérez les paramètres généraux de votre site web
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && activeTab !== 'analytics' && activeTab !== 'seo' && activeTab !== 'bing' && (
            <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          {analyticsError && activeTab === 'analytics' && (
            <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md">
              {analyticsError}
            </div>
          )}
          {seoError && activeTab === 'seo' && (
            <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md">
              {seoError}
            </div>
          )}
          {bingError && activeTab === 'bing' && (
            <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md">
              {bingError}
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="analytics">Google Indexing</TabsTrigger>
              <TabsTrigger value="bing">Bing Indexing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Nom du Site</Label>
                <Input
                  id="siteName"
                  name="siteName"
                  value={settings.siteName}
                  onChange={handleChange}
                  placeholder="Nom de votre site web"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Description du Site</Label>
                <Textarea
                  id="siteDescription"
                  name="siteDescription"
                  value={settings.siteDescription}
                  onChange={handleChange}
                  placeholder="Description de votre site web"
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteUrl">URL du Site</Label>
                <Input
                  id="siteUrl"
                  name="siteUrl"
                  value={settings.siteUrl}
                  onChange={handleChange}
                  placeholder="https://votre-site.com"
                  type="url"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  name="logoUrl"
                  value={settings.logoUrl}
                  onChange={handleChange}
                  placeholder="/logo.png"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="faviconUrl">Favicon URL</Label>
                <Input
                  id="faviconUrl"
                  name="faviconUrl"
                  value={settings.faviconUrl}
                  onChange={handleChange}
                  placeholder="/favicon.ico"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="postsPerPage">Posts Per Page</Label>
                <Input
                  id="postsPerPage"
                  name="postsPerPage"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.postsPerPage}
                  onChange={(e) => handleNumberChange('postsPerPage', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Input
                  id="dateFormat"
                  name="dateFormat"
                  value={settings.dateFormat}
                  onChange={handleChange}
                  placeholder="MMMM d, yyyy"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeFormat">Time Format</Label>
                <Input
                  id="timeFormat"
                  name="timeFormat"
                  value={settings.timeFormat}
                  onChange={handleChange}
                  placeholder="h:mm a"
                  required
                />
              </div>
            </TabsContent>
            
            <TabsContent value="seo" className="space-y-4">
              {seoLoading ? (
                <div>Loading meta tags...</div>
              ) : seo ? (
                <>
              <div className="space-y-2">
                    <Label htmlFor="title">Page Title</Label>
                <Input
                      id="title"
                      name="title"
                      value={seo.title || ''}
                      onChange={handleSeoChange}
                      placeholder="Page Title"
                  maxLength={60}
                />
              </div>
              <div className="space-y-2">
                    <Label htmlFor="description">Meta Description</Label>
                <Textarea
                      id="description"
                      name="description"
                      value={seo.description || ''}
                      onChange={handleSeoChange}
                      placeholder="Meta description for your site"
                  maxLength={160}
                  className="min-h-[100px]"
                />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Meta Author</Label>
                    <Input
                      id="author"
                      name="author"
                      value={seo.author || ''}
                      onChange={handleSeoChange}
                      placeholder="Author name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Meta Keywords</Label>
                    <Input
                      id="keywords"
                      name="keywords"
                      value={seo.keywords || ''}
                      onChange={handleSeoChange}
                      placeholder="keywords, separated, by, commas"
                    />
              </div>
                  <div className="pt-4 font-semibold">Open Graph (og:) Tags</div>
              <div className="space-y-2">
                    <Label htmlFor="ogTitle">OG Title</Label>
                <Input
                      id="ogTitle"
                      name="ogTitle"
                      value={seo.ogTitle || ''}
                      onChange={handleSeoChange}
                      placeholder="OG Title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ogDescription">OG Description</Label>
                    <Textarea
                      id="ogDescription"
                      name="ogDescription"
                      value={seo.ogDescription || ''}
                      onChange={handleSeoChange}
                      placeholder="OG Description"
                      className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                    <Label htmlFor="ogUrl">OG URL</Label>
                <Input
                      id="ogUrl"
                      name="ogUrl"
                      value={seo.ogUrl || ''}
                      onChange={handleSeoChange}
                      placeholder="https://your-site.com"
                  type="url"
                />
              </div>
              <div className="space-y-2">
                    <Label htmlFor="ogImage">OG Image URL</Label>
                <Input
                      id="ogImage"
                      name="ogImage"
                      value={seo.ogImage || ''}
                      onChange={handleSeoChange}
                      placeholder="https://your-site.com/image.jpg"
                  type="url"
                />
              </div>
                  <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="ogImageWidth">OG Image Width</Label>
                      <Input
                        id="ogImageWidth"
                        name="ogImageWidth"
                        value={seo.ogImageWidth || ''}
                        onChange={handleSeoChange}
                        placeholder="1200"
                        type="number"
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="ogImageHeight">OG Image Height</Label>
                      <Input
                        id="ogImageHeight"
                        name="ogImageHeight"
                        value={seo.ogImageHeight || ''}
                        onChange={handleSeoChange}
                        placeholder="630"
                        type="number"
                      />
                    </div>
                  </div>
              <div className="space-y-2">
                    <Label htmlFor="ogImageAlt">OG Image Alt</Label>
                <Input
                      id="ogImageAlt"
                      name="ogImageAlt"
                      value={seo.ogImageAlt || ''}
                      onChange={handleSeoChange}
                      placeholder="Image alt text"
                />
              </div>
              <div className="space-y-2">
                    <Label htmlFor="ogType">OG Type</Label>
                <Input
                      id="ogType"
                      name="ogType"
                      value={seo.ogType || ''}
                      onChange={handleSeoChange}
                      placeholder="website, article, etc."
                />
              </div>
                  <div className="pt-4 font-semibold">Twitter Card Tags</div>
              <div className="space-y-2">
                    <Label htmlFor="twitterCard">Twitter Card Type</Label>
                <Input
                      id="twitterCard"
                      name="twitterCard"
                      value={seo.twitterCard || ''}
                      onChange={handleSeoChange}
                      placeholder="summary_large_image"
                />
              </div>
              <div className="space-y-2">
                    <Label htmlFor="twitterTitle">Twitter Title</Label>
                <Input
                      id="twitterTitle"
                      name="twitterTitle"
                      value={seo.twitterTitle || ''}
                      onChange={handleSeoChange}
                      placeholder="Twitter Title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitterDescription">Twitter Description</Label>
                    <Textarea
                      id="twitterDescription"
                      name="twitterDescription"
                      value={seo.twitterDescription || ''}
                      onChange={handleSeoChange}
                      placeholder="Twitter Description"
                      className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                    <Label htmlFor="twitterImage">Twitter Image URL</Label>
                <Input
                      id="twitterImage"
                      name="twitterImage"
                      value={seo.twitterImage || ''}
                      onChange={handleSeoChange}
                      placeholder="https://your-site.com/image.jpg"
                      type="url"
                />
              </div>
                </>
              ) : null}
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-4">
              {analyticsLoading ? (
                <div>Loading Google Indexing credentials...</div>
              ) : (
                <>
              <div className="space-y-2">
                    <Label htmlFor="privateKey">Private Key</Label>
                    <Textarea
                      id="privateKey"
                      name="privateKey"
                      value={analytics.privateKey}
                      onChange={handleAnalyticsChange}
                      placeholder="Paste your private key here"
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Client Email</Label>
                    <Input
                      id="clientEmail"
                      name="clientEmail"
                      value={analytics.clientEmail}
                      onChange={handleAnalyticsChange}
                      placeholder="your-service-account@project.iam.gserviceaccount.com"
                      type="email"
                    />
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="bing" className="space-y-4">
              {bingLoading ? (
                <div>Loading Bing Indexing data...</div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bingApiKey">Bing API Key</Label>
                    <Input
                      id="bingApiKey"
                      name="apiKey"
                      value={bing.apiKey}
                      onChange={handleBingChange}
                      placeholder="Enter your Bing API key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bingSiteUrl">Bing Site URL</Label>
                    <Input
                      id="bingSiteUrl"
                      name="siteUrl"
                      value={bing.siteUrl}
                      onChange={handleBingChange}
                      placeholder="https://your-site.com"
                      type="url"
                    />
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={saving || analyticsSaving || seoSaving || bingSaving}>
            {(saving || analyticsSaving || seoSaving || bingSaving) ? 'Sauvegarde...' : 'Sauvegarder les Paramètres'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
