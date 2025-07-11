'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useState } from 'react';

export default function GoogleAnalytics() {
  const pathname = usePathname() || '';
  const [shouldLoad, setShouldLoad] = useState(false);

  // Only load GA on non-dashboard pages and after user interaction
  useEffect(() => {
    if (pathname.startsWith('/dashboard')) return;
    
    // Delay loading until user interaction or after 3 seconds
    const handleUserInteraction = () => {
      setShouldLoad(true);
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('scroll', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    // Set up interaction listeners
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('scroll', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    // Fallback: load after 3 seconds even without interaction
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 3000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('scroll', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [pathname]);

  if (pathname.startsWith('/dashboard') || !shouldLoad) return null;

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-D086123LZ6"
        strategy="lazyOnload"
      />
      <Script
        id="gtag-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-D086123LZ6', {
              page_title: document.title,
              page_location: window.location.href
            });
          `,
        }}
      />
    </>
  );
} 