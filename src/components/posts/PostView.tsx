'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';
import { Badge } from '../ui/badge';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem
} from '../ui/navigation-menu';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../lib/auth';

interface PostViewProps {
  slug?: string;
}

export function PostView({ slug: propSlug }: PostViewProps = {}) {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [post, setPost] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Navigation scroll state
  const navRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Support all possible params
  const urlSlug = params?.slug as string;
  const categorySlug = params?.categorySlug as string;
  const subcategorySlug = params?.subcategorySlug as string;
  
  // Use prop slug if provided, otherwise try to get from URL params
  const slug = propSlug || urlSlug || categorySlug;

  useEffect(() => {
    setMounted(true);
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
      console.log('PostView Scroll Debug:', {
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

  useEffect(() => {
    const fetchAll = async () => {
      // Don't fetch if slug is undefined or empty
      if (!slug) {
        setError('No post slug provided');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        const [postData, postsData, categoriesData] = await Promise.all([
          api.get(`/posts/slug/${slug}`),
          api.get('/posts'),
          api.get('/categories'),
        ]);
        setPost(postData);
        setPosts(postsData.filter((p: any) => p.status === 'published'));
        setCategories(categoriesData);
      } catch (err) {
        setError('Post not found');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [slug]);

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
  const placeholderImg = 'https://placehold.co/100x100?text=No+Image';

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
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
                      <button
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 whitespace-nowrap`}
                        onClick={() => router.push('/')}
                      >
                        Tout
                      </button>
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
                          <button
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                              isActive 
                                ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900' 
                                : 'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                            onClick={() => router.push(`/${category.slug}`)}
                          >
                            {category.name}
                          </button>
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
                    [&_ul_ul]:list-[circle] [&_ul_ul]:ml-4 [&_ul_ul]:my-2
                    [&_ol_ol]:list-[lower-alpha] [&_ol_ol]:ml-4 [&_ol_ol]:my-2
                    [&_ul_ol]:list-decimal [&_ul_ol]:ml-4 [&_ul_ol]:my-2
                    [&_ol_ul]:list-disc [&_ol_ul]:ml-4 [&_ol_ul]:my-2
                    [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-gray-600
                    [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
                    [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_img]:shadow-md
                    [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800
                    [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:my-6 [&_h1]:text-gray-900 [&_h1]:border-b [&_h1]:border-gray-200 [&_h1]:pb-2
                    [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-5 [&_h2]:text-gray-800 [&_h2]:border-b [&_h2]:border-gray-100 [&_h2]:pb-2
                    [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:my-4 [&_h3]:text-gray-700
                    [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:my-3 [&_h4]:text-gray-700
                    [&_p]:my-4 [&_p]:leading-relaxed [&_p]:text-gray-700
                    [&_section]:my-8 [&_section]:border-b [&_section]:border-gray-100 [&_section]:pb-6 [&_section:last-child]:border-b-0
                    [&_article]:max-w-none
                    [&_.biography]:max-w-none
                    [&_.person-name]:text-4xl [&_.person-name]:font-bold [&_.person-name]:text-center [&_.person-name]:my-6 [&_.person-name]:text-gray-900
                    [&_.bio-intro]:text-lg [&_.bio-intro]:leading-relaxed [&_.bio-intro]:text-gray-600 [&_.bio-intro]:my-6 [&_.bio-intro]:font-light
                    [&_.main-image]:mx-auto [&_.main-image]:block [&_.main-image]:rounded-xl [&_.main-image]:shadow-lg [&_.main-image]:my-8
                    [&_.context-image]:mx-auto [&_.context-image]:block [&_.context-image]:rounded-xl [&_.context-image]:shadow-lg [&_.context-image]:my-8
                    [&_.table-wrapper]:overflow-x-auto [&_.table-wrapper]:my-6 [&_.table-wrapper]:-mx-4 [&_.table-wrapper]:px-4 [&_.table-wrapper]:sm:mx-0 [&_.table-wrapper]:sm:px-0
                    [&_table]:w-full [&_table]:min-w-full [&_table]:border-collapse [&_table]:bg-white [&_table]:rounded-lg [&_table]:shadow-sm [&_table]:text-sm
                    [&_table.quick-facts]:max-w-md [&_table.quick-facts]:mx-auto [&_table.quick-facts]:border [&_table.quick-facts]:border-gray-300
                    [&_table_caption]:bg-gray-50 [&_table_caption]:px-2 [&_table_caption]:py-2 [&_table_caption]:text-base [&_table_caption]:font-semibold [&_table_caption]:text-gray-800 [&_table_caption]:border-b [&_table_caption]:border-gray-300
                    [&_table_th]:bg-gray-50 [&_table_th]:px-2 [&_table_th]:py-2 [&_table_th]:text-left [&_table_th]:font-semibold [&_table_th]:text-gray-700 [&_table_th]:border-b [&_table_th]:border-gray-300 [&_table_th]:text-xs [&_table_th]:whitespace-nowrap
                    [&_table_td]:px-2 [&_table_td]:py-2 [&_table_td]:text-gray-600 [&_table_td]:border-b [&_table_td]:border-gray-200 [&_table_td]:text-xs [&_table_td]:break-words
                    [&_table_tr:last-child_td]:border-b-0 [&_table_tr:last-child_th]:border-b-0
                    [&_table_tr:hover]:bg-gray-50
                    [&_.table-of-contents]:bg-gray-50 [&_.table-of-contents]:rounded-lg [&_.table-of-contents]:p-6 [&_.table-of-contents]:my-8 [&_.table-of-contents]:border [&_.table-of-contents]:border-gray-200
                    [&_.table-of-contents_h2]:text-xl [&_.table-of-contents_h2]:font-bold [&_.table-of-contents_h2]:mb-4 [&_.table-of-contents_h2]:text-gray-800 [&_.table-of-contents_h2]:border-0 [&_.table-of-contents_h2]:pb-0
                    [&_.table-of-contents_ul]:list-none [&_.table-of-contents_ul]:ml-0 [&_.table-of-contents_ul]:pl-0
                    [&_.table-of-contents_li]:my-2 [&_.table-of-contents_li]:pl-0
                    [&_.table-of-contents_a]:text-blue-600 [&_.table-of-contents_a]:hover:text-blue-800 [&_.table-of-contents_a]:hover:underline [&_.table-of-contents_a]:font-medium
                    [&_.bio-meta]:my-8
                    [&_.bio-content]:max-w-none
                    dark:[&_blockquote]:border-gray-600 dark:[&_blockquote]:text-gray-300
                    dark:[&_code]:bg-gray-800 dark:[&_code]:text-gray-200
                    dark:[&_a]:text-blue-400 dark:[&_a:hover]:text-blue-300
                    dark:[&_h1]:text-gray-100 dark:[&_h1]:border-gray-700
                    dark:[&_h2]:text-gray-200 dark:[&_h2]:border-gray-700
                    dark:[&_h3]:text-gray-300 dark:[&_h4]:text-gray-300
                    dark:[&_p]:text-gray-300
                    dark:[&_.person-name]:text-gray-100
                    dark:[&_.bio-intro]:text-gray-400
                    dark:[&_table]:bg-gray-800 dark:[&_table]:border-gray-600
                    dark:[&_table_caption]:bg-gray-700 dark:[&_table_caption]:text-gray-200 dark:[&_table_caption]:border-gray-500
                    dark:[&_table_th]:bg-gray-700 dark:[&_table_th]:text-gray-200 dark:[&_table_th]:border-gray-500
                    dark:[&_table_td]:text-gray-300 dark:[&_table_td]:border-gray-600
                    dark:[&_table_tr:hover]:bg-gray-700
                    dark:[&_.table-of-contents]:bg-gray-800 dark:[&_.table-of-contents]:border-gray-700
                    dark:[&_.table-of-contents_h2]:text-gray-200
                    dark:[&_.table-of-contents_a]:text-blue-400 dark:[&_.table-of-contents_a:hover]:text-blue-300
                    dark:[&_section]:border-gray-700"
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
                {post.categoryIds?.length > 0 && (
                  <div className="mb-2">
                    <span className="font-semibold">Categories: </span>
                    {post.categoryIds.map((cat: any) => cat.name).join(', ')}
                  </div>
                )}
                {post.tagIds?.length > 0 && (
                  <div className="mb-2">
                    <span className="font-semibold">Tags: </span>
                    {post.tagIds.map((tag: any) => tag.name).join(', ')}
                  </div>
                )}
              </div>
              {/* Up next section */}
              {upNextPosts.length > 0 && (
                <div className="max-w-3xl mx-auto mt-8 bg-white dark:bg-zinc-900 rounded shadow p-6">
                  <h3 className="text-2xl font-bold mb-6 border-b pb-3">À suivre</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {upNextPosts.map((next) => (
                      <div key={next._id || next.id} className="flex gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                        <img
                          src={extractFirstImage(next.content) || placeholderImg}
                          alt={next.title}
                          className="w-20 h-20 object-cover rounded flex-shrink-0"
                          loading="lazy"
                        />
                        <div className="flex-grow min-w-0">
                          <Link
                            href={getPostUrl(next)}
                            className="font-semibold text-base hover:underline line-clamp-2 mb-2 block"
                          >
                            {next.title}
                          </Link>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {new Date(next.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-2">
                            {next.excerpt || getExcerptFromContent(next.content, 12)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Latest News Sidebar */}
            <aside className="space-y-6 md:mt-8">
              <div className="border-b pb-4">
                <h3 className="font-bold mb-2 text-zinc-800 dark:text-zinc-100">Dernières nouvelles</h3>
                <ul className="space-y-3">
                  {latestNewsPosts.map(news => (
                    <li key={news._id || news.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                      <img
                        src={extractFirstImage(news.content) || placeholderImg}
                        alt={news.title}
                        className="w-20 h-16 object-cover rounded border flex-shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <Link
                          href={getPostUrl(news)}
                          className="hover:underline underline-offset-2 transition-all text-zinc-900 dark:text-zinc-100 font-medium line-clamp-2 text-sm leading-tight mb-1"
                        >
                          {news.title}
                        </Link>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-1">
                          {news.excerpt || getExcerptFromContent(news.content, 8)}
                        </div>
                        <div className="text-xs text-zinc-400">{new Date(news.createdAt).toLocaleDateString()}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Sticky Advertisement Banner */}
              <div className="sticky top-4">
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                  <span className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4 block">Publicité</span>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-8 mb-4 min-h-[200px] flex flex-col justify-center">
                    <div className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-3">Your Ad Here</div>
                    <div className="text-base text-gray-600 dark:text-gray-300 mb-4">Premium advertising space available</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">300x250 Banner</div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">Sponsored Content</div>
                </div>
                
                {/* Second Ad Banner */}
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center mt-6">
                  <span className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4 block">Publicité</span>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-8 mb-4 min-h-[180px] flex flex-col justify-center">
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">Special Offer</div>
                    <div className="text-base text-gray-600 dark:text-gray-300 mb-3">Limited time deal</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">300x200 Banner</div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">Sponsored Content</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function getExcerptFromContent(html: string, wordCount = 15): string {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const text = tmp.textContent || tmp.innerText || '';
  return text.split(/\s+/).slice(0, wordCount).join(' ') + (text.split(/\s+/).length > wordCount ? '...' : '');
} 
