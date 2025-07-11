'use client';

import { useEffect } from 'react';

interface PerformanceOptimizerProps {
  enableResourceHints?: boolean;
  enablePrefetch?: boolean;
}

export function PerformanceOptimizer({ 
  enableResourceHints = true, 
  enablePrefetch = true 
}: PerformanceOptimizerProps) {
  
  useEffect(() => {
    if (!enableResourceHints) return;

    // Add resource hints for external domains
    const resourceHints = [
      { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
      { rel: 'preconnect', href: 'https://autopublisher-crm.s3.eu-north-1.amazonaws.com' },
    ];

    const existingLinks = Array.from(document.querySelectorAll('link[rel="dns-prefetch"], link[rel="preconnect"]'));
    const existingHrefs = existingLinks.map(link => (link as HTMLLinkElement).href);

    resourceHints.forEach(hint => {
      if (!existingHrefs.includes(hint.href)) {
        const link = document.createElement('link');
        link.rel = hint.rel;
        link.href = hint.href;
        document.head.appendChild(link);
      }
    });
  }, [enableResourceHints]);

  useEffect(() => {
    if (!enablePrefetch) return;

    // Prefetch critical routes after page load
    const prefetchRoutes = [
      '/dashboard',
      '/login',
      '/register',
    ];

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          prefetchRoutes.forEach(route => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = route;
            document.head.appendChild(link);
          });
          observer.disconnect();
        }
      });
    });

    // Start prefetching when user scrolls or after 2 seconds
    const timer = setTimeout(() => {
      prefetchRoutes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    }, 2000);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [enablePrefetch]);

  useEffect(() => {
    // Remove unused CSS classes on page load
    const removeUnusedStyles = () => {
      const stylesheets = Array.from(document.styleSheets);
      
      stylesheets.forEach(stylesheet => {
        try {
          if (stylesheet.href && stylesheet.href.includes('placehold.co')) {
            // Remove placeholder CSS if present
            stylesheet.disabled = true;
          }
        } catch (e) {
          // Cross-origin stylesheets might throw errors
          console.debug('Could not access stylesheet:', e);
        }
      });
    };

    // Run after page load
    if (document.readyState === 'complete') {
      removeUnusedStyles();
    } else {
      window.addEventListener('load', removeUnusedStyles);
      return () => window.removeEventListener('load', removeUnusedStyles);
    }
  }, []);

  return null; // This component doesn't render anything
} 