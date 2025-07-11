import { Metadata } from 'next';

export interface PostMetaData {
  title: string;
  slug: string;
  excerpt?: string;
  author?: string;
  categories?: Array<{ name: string; slug: string }>;
  tags?: Array<{ name: string; slug: string }>;
  readingTime?: number;
  featured?: boolean;
  publishedAt?: string;
  updatedAt?: string;
  
  // SEO Meta Tags
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  metaImage?: string;
  canonicalUrl?: string;
  
  // Open Graph Meta Tags
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  
  // Twitter Card Meta Tags
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCard?: string;
  
  // Additional SEO fields
  focusKeyword?: string;
  
  // Structured data
  structuredData?: any;
}

export const generatePostMetadata = (postMeta: PostMetaData): Metadata => {
  // Use only the environment variable, remove /api for frontend URLs
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '');
  
  return {
    title: postMeta.metaTitle || postMeta.title,
    description: postMeta.metaDescription || postMeta.excerpt,
    keywords: postMeta.metaKeywords,
    authors: postMeta.author ? [{ name: postMeta.author }] : undefined,
    
    // Open Graph
    openGraph: {
      title: postMeta.ogTitle || postMeta.metaTitle || postMeta.title,
      description: postMeta.ogDescription || postMeta.metaDescription || postMeta.excerpt,
      type: 'article',
      url: postMeta.canonicalUrl || `${baseUrl}/${postMeta.slug}`,
      images: postMeta.ogImage ? [
        {
          url: postMeta.ogImage,
          width: 1200,
          height: 630,
          alt: postMeta.ogTitle || postMeta.title,
        }
      ] : undefined,
      publishedTime: postMeta.publishedAt,
      modifiedTime: postMeta.updatedAt,
      authors: postMeta.author ? [postMeta.author] : undefined,
      tags: postMeta.tags?.map(tag => tag.name),
    },
    
    // Twitter
    twitter: {
      card: (postMeta.twitterCard as any) || 'summary_large_image',
      title: postMeta.twitterTitle || postMeta.metaTitle || postMeta.title,
      description: postMeta.twitterDescription || postMeta.metaDescription || postMeta.excerpt,
      images: postMeta.twitterImage ? [postMeta.twitterImage] : undefined,
    },
    
    // Additional meta tags
    alternates: {
      canonical: postMeta.canonicalUrl || `${baseUrl}/${postMeta.slug}`,
    },
    
    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
};

export const generateCategoryMetadata = (categoryName: string, categorySlug: string): Metadata => {
  // Use only the environment variable, remove /api for frontend URLs
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '');
  
  return {
    title: `${categoryName} - Articles and Posts`,
    description: `Browse all articles and posts in the ${categoryName} category. Find the latest content and insights.`,
    
    openGraph: {
      title: `${categoryName} - Articles and Posts`,
      description: `Browse all articles and posts in the ${categoryName} category. Find the latest content and insights.`,
      type: 'website',
      url: `${baseUrl}/${categorySlug}`,
    },
    
    twitter: {
      card: 'summary_large_image',
      title: `${categoryName} - Articles and Posts`,
      description: `Browse all articles and posts in the ${categoryName} category. Find the latest content and insights.`,
    },
    
    alternates: {
      canonical: `${baseUrl}/${categorySlug}`,
    },
  };
};

export const generateHomeMetadata = (): Metadata => {
  // Use only the environment variable, remove /api for frontend URLs
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '');
  
  return {
    title: 'Handicap International France | Humanité, Inclusion et Solidarité Mondiale',
    description: 'Handicap International France agit dans plus de 60 pays pour soutenir les personnes handicapées et vulnérables. Actualités, missions humanitaires, droits humains, déminage, inclusion et urgences. Engagez-vous à nos côtés pour un monde plus solidaire',
    
    openGraph: {
      title: 'Handicap International France | Humanité, Inclusion et Solidarité Mondiale',
      description: 'Handicap International France intervient dans plus de 60 pays pour accompagner les personnes handicapées et vulnérables. Découvrez nos actions, nos actualités et comment vous engager.',
      type: 'website',
      url: 'https://handicap-international.fr/',
      images: [
        {
          url: 'https://handicap-international.fr/images/partage.jpg',
          width: 1200,
          height: 630,
          alt: 'Handicap International France | Humanité, Inclusion et Solidarité Mondiale',
        }
      ]
    },
    
    twitter: {
      card: 'summary_large_image',
      title: 'Handicap International France | Humanité, Inclusion et Solidarité Mondiale',
      description: 'Découvrez nos actions humanitaires en faveur des personnes handicapées et vulnérables dans le monde. Informez-vous, agissez, soutenez-nous.',
      images: ['https://handicap-international.fr/images/partage.jpg']
    },
  };
};

// Fetch post meta data from API
export const fetchPostMeta = async (slug: string): Promise<PostMetaData | null> => {
  try {
    // Use only the environment variable for API calls
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    const response = await fetch(`${apiBaseUrl}/posts/meta/${slug}`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch post meta: ${response.status} ${response.statusText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch post meta:', error);
    return null;
  }
};

// Generate JSON-LD structured data
export const generateStructuredData = (postMeta: PostMetaData) => {
  // Use only the environment variable, remove /api for frontend URLs
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '');
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: postMeta.metaTitle || postMeta.title,
    description: postMeta.metaDescription || postMeta.excerpt,
    author: {
      '@type': 'Person',
      name: postMeta.author || 'Anonymous'
    },
    datePublished: postMeta.publishedAt,
    dateModified: postMeta.updatedAt,
    url: postMeta.canonicalUrl || `${baseUrl}/${postMeta.slug}`,
    ...(postMeta.metaImage && {
      image: {
        '@type': 'ImageObject',
        url: postMeta.metaImage,
        width: 1200,
        height: 630
      }
    }),
    ...(postMeta.categories && postMeta.categories.length > 0 && {
      articleSection: postMeta.categories.map(cat => cat.name)
    }),
    ...(postMeta.tags && postMeta.tags.length > 0 && {
      keywords: postMeta.tags.map(tag => tag.name).join(', ')
    }),
    ...(postMeta.readingTime && {
      timeRequired: `PT${postMeta.readingTime}M`
    }),
    publisher: {
      '@type': 'Organization',
      name: 'CRM Platform',
      url: baseUrl
    }
  };
}; 