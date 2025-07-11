import { Metadata } from 'next';
import CategoryPageSSR from '@/page-components/CategoryPageSSR';
import { notFound } from 'next/navigation';

interface SubcategoryPageProps {
  params: Promise<{
    categorySlug: string;
    subcategorySlug: string;
  }>;
}

// Fetch categories from API
async function fetchCategories() {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    const response = await fetch(`${apiBaseUrl}/categories`, {
      next: { 
        revalidate: 300, // Cache for 5 minutes
        tags: ['categories'] 
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

// Check if this is a valid category and subcategory combination
async function isValidCategorySubcategory(categorySlug: string, subcategorySlug: string): Promise<{ category: any; subcategory: any } | null> {
  const categories = await fetchCategories();
  
  // Find parent category
  const category = categories.find((cat: any) => cat.slug === categorySlug && cat.parentId === null);
  if (!category) return null;
  
  // Find subcategory
  const subcategory = categories.find((cat: any) => cat.slug === subcategorySlug && cat.parentId === category._id);
  if (!subcategory) return null;
  
  return { category, subcategory };
}

// Generate metadata for subcategory pages
export async function generateMetadata({ params }: SubcategoryPageProps): Promise<Metadata> {
  const { categorySlug, subcategorySlug } = await params;
  
  const result = await isValidCategorySubcategory(categorySlug, subcategorySlug);
  
  if (result) {
    const { category, subcategory } = result;
    
    return {
      title: `${subcategory.name} - ${category.name} - CRM Platform`,
      description: `Browse articles in the ${subcategory.name} subcategory under ${category.name}.`,
      openGraph: {
        title: `${subcategory.name} - ${category.name}`,
        description: `Browse articles in the ${subcategory.name} subcategory under ${category.name}.`,
        type: 'website',
        siteName: 'CRM Platform',
      },
      twitter: {
        card: 'summary',
        title: `${subcategory.name} - ${category.name}`,
        description: `Browse articles in the ${subcategory.name} subcategory under ${category.name}.`,
      },
    };
  }
  
  // Invalid category/subcategory combination
  const title = `${subcategorySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')} - ${categorySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')}`;
  
  return {
    title: `${title} - CRM Platform`,
    description: 'Page not found.',
  };
}

// Fetch subcategory data for SSR
async function fetchSubcategoryData(categorySlug: string, subcategorySlug: string) {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    const [categoriesResponse, tagsResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/categories`, {
        next: { 
          revalidate: 300, // Cache for 5 minutes
          tags: ['categories'] 
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }),
      fetch(`${apiBaseUrl}/tags`, {
        next: { 
          revalidate: 600, // Cache for 10 minutes
          tags: ['tags'] 
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })
    ]);
    
    if (!categoriesResponse.ok || !tagsResponse.ok) {
      console.error('Failed to fetch subcategory data');
      return null;
    }
    
    const [categories, tags] = await Promise.all([
      categoriesResponse.json(),
      tagsResponse.json()
    ]);
    
    // Find parent category
    const category = categories.find((c: any) => c.slug === categorySlug && c.parentId === null);
    if (!category) return null;
    
    // Find subcategory
    const subcategory = categories.find((c: any) => c.slug === subcategorySlug && c.parentId === category._id);
    if (!subcategory) return null;
    
    // Fetch posts for this subcategory
    const postsResponse = await fetch(`${apiBaseUrl}/posts/by-category/${subcategorySlug}`, {
      next: { 
        revalidate: 180, // Cache for 3 minutes
        tags: ['posts', `category-${subcategorySlug}`] 
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!postsResponse.ok) {
      console.error('Failed to fetch subcategory posts');
      return null;
    }
    
    const posts = await postsResponse.json();
    
    // Filter only published posts
    const publishedPosts = posts.filter((post: any) => post.status === 'published');
    
    // Filter posts to only include those with image_urls array (don't validate URLs yet)
    const postsWithImages = publishedPosts.filter((post: any) => 
      Array.isArray(post.image_urls) && post.image_urls.length > 0
    );

    return {
      posts: postsWithImages,
      categories,
      tags,
      category,
      subcategory
    };
  } catch (error) {
    console.error('Failed to fetch subcategory data:', error);
    return null;
  }
}

export default async function SubcategoryPage({ params }: SubcategoryPageProps) {
  const { categorySlug, subcategorySlug } = await params;
  
  // Validate that this is a valid category/subcategory combination
  const result = await isValidCategorySubcategory(categorySlug, subcategorySlug);
  
  if (!result) {
    notFound();
  }
  
  // Fetch subcategory data for SSR
  const subcategoryData = await fetchSubcategoryData(categorySlug, subcategorySlug);
  
  if (!subcategoryData) {
    notFound();
  }
  
  // Use the CategoryPageSSR component with subcategory data
  return <CategoryPageSSR initialData={subcategoryData} />;
} 