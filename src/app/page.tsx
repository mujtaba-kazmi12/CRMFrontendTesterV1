import { Metadata } from 'next';
import ArticlesSSR from '@/page-components/ArticlesSSR';
import AMPRedirect from '@/components/AMPRedirect';
import { shouldRedirectToAMP, getAMPUrl } from '@/lib/mobile-detection';

// Dynamic metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  try {
    const res = await fetch(`${apiBaseUrl}/meta-tags/home`, { next: { revalidate: 60 } });
    const json = await res.json();
    const data = json.data || {};
    return {
      title: data.title || '',
      description: data.description || '',
      keywords: Array.isArray(data.keywords) ? data.keywords.join(', ') : (data.keywords || ''),
      authors: data.author ? [{ name: data.author }] : undefined,
      openGraph: {
        title: data.ogTitle || data.title || '',
        description: data.ogDescription || data.description || '',
        type: data.ogType || 'website',
        url: data.ogUrl || '',
        images: data.ogImage ? [{
          url: data.ogImage,
          width: Number(data.ogImageWidth) || 1200,
          height: Number(data.ogImageHeight) || 630,
          alt: data.ogImageAlt || data.ogTitle || data.title || '',
        }] : undefined,
      },
      twitter: {
        card: data.twitterCard || 'summary_large_image',
        title: data.twitterTitle || data.title || '',
        description: data.twitterDescription || data.description || '',
        images: data.twitterImage ? [data.twitterImage] : undefined,
      },
      alternates: {
        canonical: data.canonicalUrl || data.ogUrl || '',
      },
      robots: data.robots || undefined,
    };
  } catch (error) {
    // fallback to nothing if API fails
    return {};
  }
}

// Server-side data fetching
async function fetchHomePageData() {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    console.log('SSR: Fetching data from:', apiBaseUrl);
    
    const [postsResponse, categoriesResponse, tagsResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/posts?page=1&limit=20`, { // Fetch only the first page
        next: { 
          revalidate: 180, // Cache for 3 minutes
          tags: ['posts'] 
        },
        headers: {
          'User-Agent': 'NextJS-SSR/1.0',
          'Content-Type': 'application/json'
        }
      }),
      fetch(`${apiBaseUrl}/categories`, { 
        next: { 
          revalidate: 300, // Cache for 5 minutes
          tags: ['categories'] 
        },
        headers: {
          'User-Agent': 'NextJS-SSR/1.0',
          'Content-Type': 'application/json'
        }
      }),
      fetch(`${apiBaseUrl}/tags`, { 
        next: { 
          revalidate: 600, // Cache for 10 minutes
          tags: ['tags'] 
        },
        headers: {
          'User-Agent': 'NextJS-SSR/1.0',
          'Content-Type': 'application/json'
        }
      }),
    ]);

    console.log('SSR: Response status - Posts:', postsResponse.status, 'Categories:', categoriesResponse.status, 'Tags:', tagsResponse.status);

    const [postsData, categoriesData, tagsData] = await Promise.all([
      postsResponse.ok ? postsResponse.json() : { data: [], pagination: {} },
      categoriesResponse.ok ? categoriesResponse.json() : [],
      tagsResponse.ok ? tagsResponse.json() : [],
    ]);

    // Normalize data from paginated response
    const normalizedPosts = postsData?.data || [];
    const normalizedCategories = Array.isArray(categoriesData) ? categoriesData : 
                               (categoriesData?.data ? categoriesData.data : 
                               (categoriesData?.categories ? categoriesData.categories : []));
    const normalizedTags = Array.isArray(tagsData) ? tagsData : 
                          (tagsData?.data ? tagsData.data : 
                          (tagsData?.tags ? tagsData.tags : []));

    const publishedPosts = normalizedPosts.filter((post: any) => post.status === 'published');
    
    // Filter posts to only include those with image_urls array (don't validate URLs yet)
    const postsWithImages = publishedPosts.filter((post: any) => 
      Array.isArray(post.image_urls) && post.image_urls.length > 0
    );
    
    console.log('SSR: Data loaded -', postsWithImages.length, 'posts with image arrays,', normalizedCategories.length, 'categories,', normalizedTags.length, 'tags');

    return {
      posts: postsWithImages,
      categories: normalizedCategories,
      tags: normalizedTags,
      pagination: postsData?.pagination || { currentPage: 1, totalPages: 1 },
    };
  } catch (error) {
    console.error('SSR: Error fetching homepage data:', error);
    return {
      posts: [],
      categories: [],
      tags: [],
      pagination: { currentPage: 1, totalPages: 1 },
    };
  }
}

export default async function HomePage() {
  const { posts, categories, tags, pagination } = await fetchHomePageData();
  
  // Check if we should redirect to AMP
  const shouldRedirect = shouldRedirectToAMP();
  const ampUrl = getAMPUrl('/');
  
  return (
    <>
      {shouldRedirect && <AMPRedirect ampUrl={ampUrl} shouldRedirect={shouldRedirect} />}
      <ArticlesSSR initialPosts={posts} initialCategories={categories} initialTags={tags} initialPagination={pagination} />
    </>
  );
}