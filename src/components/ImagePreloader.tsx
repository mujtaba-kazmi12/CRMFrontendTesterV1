'use client';

import { useEffect } from 'react';

interface ImagePreloaderProps {
  imageUrl?: string;
  priority?: boolean;
  preloadMultiple?: string[]; // Array of image URLs to preload
}

export function ImagePreloader({ 
  imageUrl, 
  priority = true, 
  preloadMultiple = [] 
}: ImagePreloaderProps) {
  useEffect(() => {
    if (!priority) return;

    const imagesToPreload = imageUrl ? [imageUrl, ...preloadMultiple] : preloadMultiple;
    if (imagesToPreload.length === 0) return;

    const links: HTMLLinkElement[] = [];

    // Create preload links for all images
    imagesToPreload.forEach((url, index) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      link.fetchPriority = index === 0 ? 'high' : 'auto'; // First image gets highest priority
      
      // Add crossorigin for external domains
      if (url.includes('amazonaws.com') || url.includes('firebasestorage.googleapis.com')) {
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
      links.push(link);
    });

    // Also preload via Image constructor for immediate loading
    if (imageUrl) {
      const img = new Image();
      img.src = imageUrl;
      // Set loading priority
      if ('loading' in img) {
        img.loading = 'eager';
      }
      if ('fetchPriority' in img) {
        (img as any).fetchPriority = 'high';
      }
    }

    // Cleanup function
    return () => {
      links.forEach(link => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, [imageUrl, priority, preloadMultiple]);

  return null; // This component doesn't render anything
} 