import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/toaster';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { PerformanceOptimizer } from '@/components/PerformanceOptimizer';
import ConditionalFooter from '@/components/ui/ConditionalFooter';
import { Category, Post } from '@/types/post';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
});

export const metadata: Metadata = {
  title: 'CRM Next.js - Système CRM de Qualité Production',
  description: 'Un système CRM moderne et de qualité production construit avec Next.js, React et MongoDB.',
  keywords: 'CRM, Next.js, React, MongoDB, Tableau de bord, Gestion de Contenu',
  authors: [{ name: 'Votre Entreprise' }],
  other: {
    // AMP page link for mobile optimization
    'amp-link': 'https://handicap-internatioanl.fr/amp',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

async function fetchFooterData() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  // Fetch categories
  const categoriesRes = await fetch(`${apiBaseUrl}/categories`, { next: { revalidate: 300, tags: ['categories'] }, headers: { 'Content-Type': 'application/json' } });
  const categoriesData = await categoriesRes.json();
  // Fetch posts (latest news)
  const postsRes = await fetch(`${apiBaseUrl}/posts`, { next: { revalidate: 180, tags: ['posts'] }, headers: { 'Content-Type': 'application/json' } });
  const postsData = await postsRes.json();
  // Fetch footer content
  const footerRes = await fetch(`${apiBaseUrl}/settings/footer`, { next: { revalidate: 600, tags: ['settings'] }, headers: { 'Content-Type': 'application/json' } });
  const footerData = await footerRes.json();

  // Normalize categories
  const categories: Category[] = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || categoriesData?.categories || []);
  // Normalize posts and get latest 2 published
  const allPosts: Post[] = Array.isArray(postsData) ? postsData : (postsData?.data || []);
  const latestNews: Post[] = allPosts.filter((post: any) => post.status === 'published').sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 2);
  // Footer content
  const footerContent: string = footerData?.footerContent || '';

  return { categories, latestNews, footerContent };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { categories, latestNews, footerContent } = await fetchFooterData();
  return (
    <html lang="en" className="h-full w-full">
      <head>
        <link
          rel="preload"
          href="/_next/static/media/inter-latin-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/_next/static/media/inter-latin-500-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/_next/static/media/inter-latin-600-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect"
          href="https://handicap-internatioanl.fr"
          crossOrigin="anonymous"
        />
        <link rel="preload" href="/favicon.ico" as="image" type="image/x-icon" />
      </head>
      <body className={`${inter.className} h-full w-full m-0 p-0`}>
        <AuthProvider>
          <PerformanceOptimizer />
          <div className="min-h-screen flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            <ConditionalFooter categories={categories} latestNews={latestNews} footerContent={footerContent} />
          </div>
          <Toaster />
          <GoogleAnalytics />
        </AuthProvider>
      </body>
    </html>
  );
} 
