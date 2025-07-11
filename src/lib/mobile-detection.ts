import { headers } from 'next/headers';

export async function isMobileDevice(): Promise<boolean> {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  
  // Common mobile user agent patterns
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  return mobileRegex.test(userAgent);
}

export async function shouldRedirectToAMP(): Promise<boolean> {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const acceptHeader = headersList.get('accept') || '';
  
  // Check if it's a mobile device
  const isMobile = await isMobileDevice();
  
  // Check if it's not a bot/crawler
  const isBot = /bot|crawler|spider|crawling/i.test(userAgent);
  
  // Check if it supports AMP
  const supportsAMP = acceptHeader.includes('text/html');
  
  // Don't redirect bots, desktop users, or if AMP is not supported
  return isMobile && !isBot && supportsAMP;
}

export function getAMPUrl(currentPath: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || 'https://handicap-internatioanl.fr';
  
  // For homepage
  if (currentPath === '/') {
    return `${baseUrl}/amp`;
  }
  
  // For category pages
  if (currentPath.startsWith('/') && !currentPath.includes('/posts/')) {
    return `${baseUrl}/amp${currentPath}`;
  }
  
  // For post pages
  if (currentPath.includes('/posts/')) {
    return `${baseUrl}/amp${currentPath}`;
  }
  
  // Default to AMP homepage
  return `${baseUrl}/amp`;
}

export async function getMobileUserAgentInfo() {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  
  // Detect specific mobile browsers/devices
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !isChrome;
  const isFirefox = /Firefox/.test(userAgent);
  
  return {
    userAgent,
    isIOS,
    isAndroid,
    isChrome,
    isSafari,
    isFirefox,
    isMobile: await isMobileDevice(),
  };
}