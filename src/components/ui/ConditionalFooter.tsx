'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';
import { Category, Post } from '@/types/post';

interface ConditionalFooterProps {
  categories: Category[];
  latestNews: Post[];
  footerContent: string;
}

export default function ConditionalFooter({ categories, latestNews, footerContent }: ConditionalFooterProps) {
  const pathname = usePathname();
  
  // Don't render footer on dashboard pages
  const isDashboardPage = pathname?.startsWith('/dashboard');
  
  if (isDashboardPage) {
    return null;
  }
  
  return <Footer categories={categories} latestNews={latestNews} footerContent={footerContent} />;
} 