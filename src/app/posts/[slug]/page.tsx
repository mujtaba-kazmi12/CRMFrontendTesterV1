import { Metadata } from 'next';
import { PostView } from '@/components/posts/PostView';
import { PostViewSSR } from '@/components/posts/PostViewSSR';

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Fetch post data from API
async function fetchPostData(slug: string) {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    const response = await fetch(`${apiBaseUrl}/posts/slug/${slug}?t=${Date.now()}`, {
      cache: 'no-store', // Force fresh data
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch post: ${response.status} ${response.statusText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return null;
  }
}

// Generate metadata using actual post data from database
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // Fetch the actual post data
  const post = await fetchPostData(slug);
  
  if (!post) {
    // Fallback metadata if post not found
    const title = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return {
      title: `${title} - CRM Platform`,
      description: 'Article not found.',
    };
  }
  
  // Use custom meta fields if available, otherwise fall back to post content
  const metaTitle = post.metaTitle || post.title;
  const metaDescription = post.metaDescription || post.excerpt || 'Read this article on our CRM platform.';
  const metaKeywords = post.metaKeywords || '';
  
  // Use only the environment variable, remove /api for frontend URLs
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '');
  const canonicalUrl = post.canonicalUrl || `${baseUrl}/posts/${slug}`;
  
  return {
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords,
    
    // Open Graph
    openGraph: {
      title: post.ogTitle || metaTitle,
      description: post.ogDescription || metaDescription,
      type: 'article',
      url: canonicalUrl,
      siteName: 'CRM Platform',
      ...(post.metaImage && {
        images: [
          {
            url: post.metaImage,
            width: 1200,
            height: 630,
            alt: metaTitle,
          }
        ]
      }),
      ...(post.createdAt && { publishedTime: post.createdAt }),
      ...(post.updatedAt && { modifiedTime: post.updatedAt }),
      ...(post.authorId?.name && { authors: [post.authorId.name] }),
    },
    
    // Twitter
    twitter: {
      card: post.twitterCard || 'summary_large_image',
      title: post.twitterTitle || metaTitle,
      description: post.twitterDescription || metaDescription,
      ...(post.twitterImage && { images: [post.twitterImage] }),
    },
    
    // Additional meta tags
    alternates: {
      canonical: canonicalUrl,
    },
    
    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
      },
    },
    
    // Additional meta tags using other
    other: {
      ...(post.focusKeyword && { 'article:tag': post.focusKeyword }),
      'article:author': post.authorId?.name || 'CRM Platform',
      'article:section': post.categoryIds?.[0]?.name || 'News',
      'og:locale': 'en_US',
      'og:site_name': 'CRM Platform',
      ...(post.readingTime && { 'article:reading_time': post.readingTime.toString() }),
    },
  };
}

// Fetch post data for SSR
async function fetchPostSSRData(slug: string) {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    const [postResponse, postsResponse, categoriesResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/posts/slug/${slug}?t=${Date.now()}`, {
        cache: 'no-store', // Force fresh data
        headers: {
          'Cache-Control': 'no-cache'
        }
      }),
      fetch(`${apiBaseUrl}/posts?t=${Date.now()}`, {
        cache: 'no-store', // Force fresh data
        headers: {
          'Cache-Control': 'no-cache'
        }
      }),
      fetch(`${apiBaseUrl}/categories?t=${Date.now()}`, {
        cache: 'no-store', // Force fresh data
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
    ]);
    
    if (!postResponse.ok || !postsResponse.ok || !categoriesResponse.ok) {
      console.error('Failed to fetch post SSR data');
      return null;
    }
    
    const [post, postsData, categoriesData] = await Promise.all([
      postResponse.json(),
      postsResponse.json(),
      categoriesResponse.json()
    ]);
    
    // Ensure we have arrays and extract data if it's wrapped
    const posts = Array.isArray(postsData) ? postsData : (postsData?.data || []);
    const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);
    
    // Filter only published posts
    const publishedPosts = posts.filter((p: any) => p.status === 'published');
    
    return {
      post,
      posts: publishedPosts,
      categories
    };
  } catch (error) {
    console.error('Failed to fetch post SSR data:', error);
    return {
      post: null,
      posts: [],
      categories: []
    };
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  
  // Fetch post data for SSR
  const postSSRData = await fetchPostSSRData(slug);
  
  if (!postSSRData || !postSSRData.post) {
    // Fallback to client-side rendering if SSR fails
    return <PostView />;
  }
  
  const post = postSSRData.post;
  
  // Use only the environment variable, remove /api for frontend URLs
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '');
  
  return (
    <>
      {/* JSON-LD structured data using real post data */}
      {post && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: post.metaTitle || post.title,
              description: post.metaDescription || post.excerpt,
              author: {
                '@type': 'Person',
                name: post.authorId?.name || 'CRM Platform'
              },
              publisher: {
                '@type': 'Organization',
                name: 'CRM Platform',
                url: baseUrl
              },
              datePublished: post.createdAt,
              dateModified: post.updatedAt,
              url: post.canonicalUrl || `${baseUrl}/posts/${slug}`,
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': post.canonicalUrl || `${baseUrl}/posts/${slug}`
              },
              ...(post.metaImage && {
                image: {
                  '@type': 'ImageObject',
                  url: post.metaImage,
                  width: 1200,
                  height: 630
                }
              }),
              ...(post.categoryIds && post.categoryIds.length > 0 && {
                articleSection: post.categoryIds.map((cat: any) => cat.name).filter(Boolean)
              }),
              ...(post.tagIds && post.tagIds.length > 0 && {
                keywords: post.tagIds.map((tag: any) => tag.name).filter(Boolean).join(', ')
              }),
              ...(post.readingTime && {
                timeRequired: `PT${post.readingTime}M`
              })
            })
          }}
        />
      )}
      
      <PostViewSSR initialData={postSSRData} />
    </>
  );
} 