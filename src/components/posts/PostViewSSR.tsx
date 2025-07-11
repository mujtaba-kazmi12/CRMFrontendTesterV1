'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem
} from '../ui/navigation-menu';
import { useAuth } from '../../lib/auth';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LazyImage } from '../ui/LazyImage';
import { AdPlaceholder } from '../ui/AdPlaceholder';

interface PostViewSSRProps {
  initialData: {
    post: any;
    posts: any[];
    categories: any[];
  };
}

export function PostViewSSR({ initialData }: PostViewSSRProps) {
  const params = useParams();
  const categorySlug = params?.categorySlug as string;
  const subcategorySlug = params?.subcategorySlug as string;
  
  const [post] = useState(initialData.post);
  const [allPosts, setAllPosts] = useState(initialData.posts);
  const [posts, setPosts] = useState(initialData.posts);

  const [categories] = useState(initialData.categories);
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  // Navigation scroll state
  const navRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check initial scroll state after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      checkScrollState();
    }, 100);
    return () => clearTimeout(timer);
  }, []);



  // Check scroll state when categories change
  useEffect(() => {
    if (categories.length > 0) {
      const timer = setTimeout(() => {
        checkScrollState();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [categories]);

  // Add resize listener to recalculate arrows
  useEffect(() => {
    const handleResize = () => {
      checkScrollState();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkScrollState = () => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      const hasOverflow = scrollWidth > clientWidth;
      
      // Debug logging (remove in production)
      console.log('PostViewSSR Scroll Debug:', {
        scrollLeft,
        scrollWidth,
        clientWidth,
        hasOverflow,
        categoriesCount: categories.length
      });
      
      setShowLeftArrow(scrollLeft > 5); // Small threshold for better UX
      setShowRightArrow(hasOverflow && scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  const scrollLeft = () => {
    if (navRef.current) {
      navRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (navRef.current) {
      navRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Function to handle dashboard navigation based on user role
  const handleDashboardNavigation = () => {
    if (!user) return;
    
    if (user.role === 'USER') {
      router.push('/dashboard/posts');
    } else {
      router.push('/dashboard');
    }
  };

  // Always show latest news from any category
  const latestNewsPosts = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

  // Find current category and subcategory objects
  const currentCategory = categories.find((c: any) => c.slug === categorySlug && c.parentId === null);
  const currentSubcategory = categories.find((c: any) => c.slug === subcategorySlug && currentCategory && c.parentId === currentCategory._id);

  // Helper to get related posts (same subcategory if present, else same category, exclude current post)
  let upNextPosts: any[] = [];
  if (currentSubcategory) {
    upNextPosts = posts
      .filter(
        (p) =>
          (p._id !== post?._id && p.id !== post?.id) &&
          p.categoryIds.some((cat: any) => (cat._id || cat.id) === currentSubcategory._id)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  } else if (currentCategory) {
    upNextPosts = posts
      .filter(
        (p) =>
          (p._id !== post?._id && p.id !== post?.id) &&
          p.categoryIds.some((cat: any) => (cat._id || cat.id) === currentCategory._id)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  } else {
    upNextPosts = posts
      .filter((p) => (p._id !== post?._id && p.id !== post?.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }

  function extractFirstImage(html: string): string | null {
    if (!html) return null;
    const match = html.match(/<img[^>]+src=["']([^"'>]+)["']/i);
    return match ? match[1] : null;
  }

  function getPostImage(post: any): string | null {
    // Use image_urls array if available
    if (Array.isArray(post.image_urls) && post.image_urls.length > 0) {
      return post.image_urls[0];
    }
    
    // Fallback to extracting from content
    return extractFirstImage(post.content);
  }

  function getPostImageWithFallbacks(post: any): string[] {
    // Return all available image URLs for fallback
    if (Array.isArray(post.image_urls) && post.image_urls.length > 0) {
      return post.image_urls;
    }
    
    // Fallback to content image
    const contentImage = extractFirstImage(post.content);
    return contentImage ? [contentImage] : [];
  }

  const handleImageError = (postId: string) => {
    // Image error handling moved to backend
  };

  const placeholderImg = 'https://placehold.co/100x100?text=No+Image';

  if (!post) return null;

  // Helper to build post detail header context
  let headerContext = '';
  if (currentCategory && currentSubcategory) {
    headerContext = `${currentCategory.name} / ${currentSubcategory.name}`;
  } else if (currentCategory) {
    headerContext = currentCategory.name;
  } else if (post.categoryIds && post.categoryIds[0]?.name) {
    headerContext = post.categoryIds[0].name;
  }

  // Helper to build post detail URL for up next/latest news
  function getPostUrl(p: any) {
    // Use direct post slug for all posts
    return `/${p.slug}`;
  }

  // Filter parent categories (those without parentId)
  const parentCategories = categories.filter(category => 
    !category.parentId // This handles null, undefined, empty string, etc.
  );

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-900">
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 px-2 md:px-0">
          {/* Header */}
          <header className="mb-4 border-b pb-4 text-center relative">
            {/* Login/Dashboard Button - Top Right */}
            
            
            <h1 className="text-4xl md:text-5xl font-serif font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6">
            <Link href="/" className="hover:opacity-80 transition-opacity cursor-pointer">
                Handicap International
              </Link>
            </h1>
            <div className="text-zinc-500 dark:text-zinc-400 text-sm">{new Date(post.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </header>
          
          {/* Category Navbar */}
          <nav className="mb-8 relative">
            {/* Left Arrow */}
            {showLeftArrow && (
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 md:hidden"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </button>
            )}
            
            {/* Right Arrow */}
            {showRightArrow && (
              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 md:hidden"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </button>
            )}
            
            <div 
              ref={navRef}
              className="overflow-x-auto scrollbar-hide px-10 md:px-2"
              onScroll={checkScrollState}
            >
              <div className="flex justify-center min-w-max">
                <NavigationMenu>
                  <NavigationMenuList className="flex-nowrap gap-2 min-w-max">
                    <NavigationMenuItem>
                      <Link
                        href="/"
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 whitespace-nowrap inline-block`}
                        prefetch={true}
                      >
                        Tout
                      </Link>
                    </NavigationMenuItem>

                    {parentCategories.map(category => {
                      // Check if this category is active (post belongs to this category or its subcategories)
                      const isActive = post.categoryIds?.some((postCat: any) => {
                        const postCategoryId = postCat._id || postCat.id || postCat;
                        // Check if the post category matches this parent category
                        if (postCategoryId === category._id) return true;
                        // Check if the post category is a subcategory of this parent category
                        const postCategoryObj = categories.find(cat => (cat._id || cat.id) === postCategoryId);
                        return postCategoryObj?.parentId === category._id;
                      });

                      return (
                        <NavigationMenuItem key={category._id}>
                          <Link
                            href={`/${category.slug}`}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap inline-block ${
                              isActive 
                                ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900' 
                                : 'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                            prefetch={true}
                          >
                            {category.name}
                          </Link>
                        </NavigationMenuItem>
                      );
                    })}
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            </div>
          </nav>
          {/* Main content and sidebar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Post content */}
            <div className="md:col-span-2">
              <div className="max-w-3xl mx-auto p-10 bg-white dark:bg-zinc-900 rounded shadow">
                <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
                <div className="text-gray-500 mb-4">
                  {post.authorId?.name && <span>By {post.authorId.name} | </span>}
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <div 
                  className="prose prose-lg max-w-none mb-6 
                    [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-4 [&_ul]:pl-2
                    [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-4 [&_ol]:pl-2
                    [&_li]:my-2 [&_li]:pl-1
                    [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4
                    [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4
                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3
                    [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2
                    [&_h4]:text-base [&_h4]:font-bold [&_h4]:mt-3 [&_h4]:mb-2
                    [&_h5]:text-sm [&_h5]:font-bold [&_h5]:mt-2 [&_h5]:mb-1
                    [&_h6]:text-xs [&_h6]:font-bold [&_h6]:mt-2 [&_h6]:mb-1
                    [&_p]:my-4 [&_p]:leading-7
                    [&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-800
                    [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-4
                    [&_.table-wrapper]:overflow-x-auto [&_.table-wrapper]:my-4 [&_.table-wrapper]:-mx-4 [&_.table-wrapper]:px-4 [&_.table-wrapper]:sm:mx-0 [&_.table-wrapper]:sm:px-0
                    [&_table]:w-full [&_table]:min-w-full [&_table]:border-collapse [&_table]:border [&_table]:border-gray-300 [&_table]:text-sm
                    [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:px-2 [&_th]:py-2 [&_th]:font-bold [&_th]:text-xs [&_th]:whitespace-nowrap
                    [&_td]:border [&_td]:border-gray-300 [&_td]:px-2 [&_td]:py-2 [&_td]:text-xs [&_td]:break-words
                    [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
                    [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:my-4
                    [&_pre_code]:bg-transparent [&_pre_code]:p-0
                    dark:[&_blockquote]:border-gray-600
                    dark:[&_a]:text-blue-400 dark:hover:[&_a]:text-blue-300
                    dark:[&_table]:border-gray-600
                    dark:[&_th]:border-gray-600 dark:[&_th]:bg-gray-700
                    dark:[&_td]:border-gray-600
                    dark:[&_code]:bg-gray-800
                    dark:[&_pre]:bg-gray-800"
                  dangerouslySetInnerHTML={{ 
                    __html: post.content.replace(
                      /<table/g, 
                      '<div class="table-wrapper"><table'
                    ).replace(
                      /<\/table>/g, 
                      '</table></div>'
                    )
                  }}
                />
                {/* Tags */}
                {post.tagIds && post.tagIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6">
                    {post.tagIds.map((tag: any) => (
                      <Badge key={tag._id || tag.id} variant="secondary" className="text-xs">
                        #{tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Up Next Section - Moved to bottom */}
              {upNextPosts.length > 0 && (
                <div className="max-w-3xl mx-auto mt-8 bg-white dark:bg-zinc-900 rounded shadow p-6">
                  <h3 className="text-2xl font-bold mb-6 border-b pb-3">À suivre</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {upNextPosts.map(upNextPost => (
                      <div key={upNextPost._id || upNextPost.id} className="flex gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                        {getPostImage(upNextPost) && (
                          <LazyImage
                            src={getPostImage(upNextPost)!}
                            alt={upNextPost.title}
                            className="w-20 h-20 object-cover rounded flex-shrink-0"
                            aspectRatio="1/1"
                            imageUrls={getPostImageWithFallbacks(upNextPost)}
                            onError={() => handleImageError(upNextPost.id)}
                          />
                        )}
                        <div className="flex-grow min-w-0">
                          <Link href={getPostUrl(upNextPost)} className="font-semibold text-base hover:underline line-clamp-2 mb-2 block">
                            {upNextPost.title}
                          </Link>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {new Date(upNextPost.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-2">
                            {upNextPost.excerpt || 'En savoir plus sur ce sujet...'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Sidebar - Only Latest News */}
            <div className="space-y-8">
              {/* Latest News Section */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded shadow">
                <h3 className="text-lg font-bold mb-4 border-b pb-2">Dernières nouvelles</h3>
                <div className="space-y-4">
                  {latestNewsPosts.slice(0, 8).map(latestPost => (
                    <div key={latestPost._id || latestPost.id} className="flex gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                      {getPostImage(latestPost) && (
                        <LazyImage
                          src={getPostImage(latestPost)!}
                          alt={latestPost.title}
                          className="w-16 h-16 object-cover rounded flex-shrink-0"
                          aspectRatio="1/1"
                          imageUrls={getPostImageWithFallbacks(latestPost)}
                          onError={() => handleImageError(latestPost.id)}
                        />
                      )}
                      <div className="flex-grow min-w-0">
                        <Link href={getPostUrl(latestPost)} className="font-medium text-sm hover:underline line-clamp-2 mb-1 block">
                          {latestPost.title}
                        </Link>
                        <div className="text-xs text-gray-500 mb-1">
                          {new Date(latestPost.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400 line-clamp-1">
                          {latestPost.excerpt || 'Dernière mise à jour des nouvelles...'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sticky Advertisement Banner */}
              <div className="sticky top-6">
                <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg flex flex-col items-center py-8 px-4">
                  <span className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4 block">Publicité</span>
                                        <AdPlaceholder width={300} height={250} className="w-full max-w-[300px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 