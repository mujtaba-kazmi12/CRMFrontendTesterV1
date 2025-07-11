import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostAMP from '@/page-components/PostAMP';

interface Props {
  params: Promise<{ slug: string }>;
}

// Generate metadata for AMP post pages
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  try {
    const res = await fetch(`${apiBaseUrl}/posts/slug/${slug}`, {
      next: { revalidate: 300 }
    });
    
    if (!res.ok) {
      return { title: 'Article not found - AMP' };
    }
    
    const post = await res.json();
    
    return {
      title: `${post.title} - AMP`,
      description: post.excerpt || post.content?.substring(0, 160) || '',
      other: {
        'format-detection': 'telephone=no',
        'amp-script-src': 'sha384-allowed',
      },
    };
  } catch (error) {
    return { title: 'Article - AMP' };
  }
}

// Fetch post data for AMP
async function fetchAMPPostData(slug: string) {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    const [postResponse, categoriesResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/posts/slug/${slug}`, {
        next: { revalidate: 300 },
        headers: {
          'User-Agent': 'NextJS-AMP/1.0',
          'Content-Type': 'application/json'
        }
      }),
      fetch(`${apiBaseUrl}/categories`, {
        next: { revalidate: 600 },
        headers: {
          'User-Agent': 'NextJS-AMP/1.0',
          'Content-Type': 'application/json'
        }
      }),
    ]);

    if (!postResponse.ok) {
      return null;
    }

    const [post, categoriesData] = await Promise.all([
      postResponse.json(),
      categoriesResponse.ok ? categoriesResponse.json() : [],
    ]);

    const normalizedCategories = Array.isArray(categoriesData) ? categoriesData : 
                               (categoriesData?.data ? categoriesData.data : 
                               (categoriesData?.categories ? categoriesData.categories : []));

    return {
      post,
      categories: normalizedCategories,
    };
  } catch (error) {
    console.error('AMP: Error fetching post data:', error);
    return null;
  }
}

export default async function AMPPostPage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchAMPPostData(slug);
  
  if (!data) {
    notFound();
  }
  
  return <PostAMP post={data.post} categories={data.categories} />;
}