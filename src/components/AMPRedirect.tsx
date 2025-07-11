'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AMPRedirectProps {
  ampUrl: string;
  shouldRedirect: boolean;
}

export function AMPRedirect({ ampUrl, shouldRedirect }: AMPRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    if (shouldRedirect && typeof window !== 'undefined') {
      // Check if user has opted out of AMP
      const ampOptOut = localStorage.getItem('amp-opt-out');
      if (ampOptOut === 'true') {
        return;
      }

      // Check if this is the first visit or if user prefers AMP
      const userPreference = localStorage.getItem('amp-preference');
      if (userPreference === 'disabled') {
        return;
      }

      // Show a brief notification before redirect (optional)
      const shouldShowNotification = !localStorage.getItem('amp-redirect-shown');
      
      if (shouldShowNotification) {
        // Set a flag to avoid showing notification repeatedly
        localStorage.setItem('amp-redirect-shown', 'true');
        
        // Brief delay to allow page to load minimally
        setTimeout(() => {
          window.location.href = ampUrl;
        }, 100);
      } else {
        // Immediate redirect for returning users
        window.location.href = ampUrl;
      }
    }
  }, [ampUrl, shouldRedirect, router]);

  // Don't render anything, this is just for the redirect logic
  return null;
}

export default AMPRedirect;