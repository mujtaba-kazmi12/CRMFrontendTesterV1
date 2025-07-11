'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Post, Category, Tag } from '../types/post';
import dynamic from 'next/dynamic';

// Dynamic imports for components used conditionally
const Carousel = dynamic(() => import('../components/ui/carousel').then(mod => ({ default: mod.Carousel })), { ssr: false });
const CarouselContent = dynamic(() => import('../components/ui/carousel').then(mod => ({ default: mod.CarouselContent })), { ssr: false });
const CarouselItem = dynamic(() => import('../components/ui/carousel').then(mod => ({ default: mod.CarouselItem })), { ssr: false });
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
} from '../components/ui/navigation-menu';
import { useAuth } from '../lib/auth';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LazyImage } from '../components/ui/LazyImage';
import { SearchBar } from '../components/ui/SearchBar';
import { AdPlaceholder } from '../components/ui/AdPlaceholder';
import { ImagePreloader } from '../components/ImagePreloader';

// Simple skeleton component
const SkeletonPost: React.FC = () => (
  <div className="w-full flex flex-col gap-2 animate-pulse">
    <div className="w-full h-48 bg-zinc-300 dark:bg-zinc-700 rounded" />
    <div className="h-4 bg-zinc-300 dark:bg-zinc-700 rounded w-3/4" />
    <div className="h-4 bg-zinc-300 dark:bg-zinc-700 rounded w-1/2" />
  </div>
);

const placeholderImg = 'https://placehold.co/600x400?text=No+Image';
const imageBaseUrl = 'https://handicap-internatioanl.fr';

function extractFirstImage(html: string): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"'>]+)["']/i);
  return match ? match[1] : null;
}

function getPostImage(post: Post): string | null {
  // Use image_urls array (posts are already filtered to have this)
  if (Array.isArray(post.image_urls) && post.image_urls.length > 0) {
    const imagePath = post.image_urls[0];
    if (imagePath.startsWith('http')) {
      return imagePath; // Already a full URL
    }
    return `${imageBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  }
  
  return null;
}

function getPostImageWithFallbacks(post: Post): string[] {
  // Return all available image URLs for fallback
  if (Array.isArray(post.image_urls) && post.image_urls.length > 0) {
    return post.image_urls.map(imagePath => {
      if (imagePath.startsWith('http')) {
        return imagePath; // Already a full URL
      }
      return `${imageBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    });
  }
  
  return [];
}

// Helper to strip HTML and get first N words
function getExcerptFromContent(html: string, wordCount = 15): string {
  if (!html) return '';
  // Use regex to strip HTML tags consistently on both server and client
    const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return text.split(/\s+/).slice(0, wordCount).join(' ') + (text.split(/\s+/).length > wordCount ? '...' : '');
}

interface Pagination {
  currentPage: number;
  totalPages: number;
}

interface ArticlesSSRProps {
  initialPosts: Post[];
  initialCategories: Category[];
  initialTags: Tag[];
  initialPagination: Pagination;
}

export default function ArticlesSSR({ initialPosts, initialCategories, initialTags, initialPagination }: ArticlesSSRProps) {
  const router = useRouter();
  const [allPosts, setAllPosts] = useState<Post[]>(initialPosts || []);
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [tags, setTags] = useState<Tag[]>(initialTags || []);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user } = useAuth();

  // Navigation scroll state
  const navRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Helper functions for getting category and tag names
  const getCategoryNames = (cats: any[]) =>
    cats.map(cat => typeof cat === 'string' ? categories.find(c => c._id === cat)?.name : cat.name).filter(Boolean);
  const getTagNames = (tagsArr: any[]) =>
    tagsArr.map(tag => typeof tag === 'string' ? tags.find(t => t.id === tag)?.name : tag.name).filter(Boolean);

  // Initialize posts from pre-filtered server data and handle search
  // Infinite scroll logic
  const fetchMorePosts = async () => {
    if (isLoading || pagination.currentPage >= pagination.totalPages) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextPage = pagination.currentPage + 1;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/posts?page=${nextPage}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const newData = await response.json();
      const newPosts = newData.data || [];

      setAllPosts(prev => [...prev, ...newPosts]);
      setPosts(prev => [...prev, ...newPosts]);
      setPagination(newData.pagination);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Intersection observer for infinite loading
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        const first = entries[0];
        if (first.isIntersecting && !isLoading && !searchQuery.trim()) {
          fetchMorePosts();
        }
      },
      { rootMargin: '1000px' }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loaderRef.current, isLoading, pagination, searchQuery]);

  // Initialize posts from pre-filtered server data and handle search
  useEffect(() => {
    // When a search is active, only show filtered results from the currently loaded posts
    if (searchQuery.trim() && searchQuery.trim().length >= 2) {
      const searchTerm = searchQuery.toLowerCase().trim();
      const searchWords = searchTerm.split(' ').filter(word => word.length > 1); // Only words with 2+ characters
      
      const filteredPosts = allPosts.filter(post => {
        const title = post.title.toLowerCase();
        const content = post.content.toLowerCase();
        const excerpt = (post.excerpt || '').toLowerCase();
        const categoryNames = getCategoryNames(post.categoryIds).map(cat => cat.toLowerCase()).join(' ');
        const tagNames = getTagNames(post.tagIds).map(tag => tag.toLowerCase()).join(' ');
        
        // Combine all searchable text
        const searchableText = `${title} ${content} ${excerpt} ${categoryNames} ${tagNames}`;
        
        // Check if all search words are present (AND logic)
        return searchWords.every(word => searchableText.includes(word));
      });
      
      // Sort results by relevance (exact title matches first, then title contains, then content)
      const sortedPosts = filteredPosts.sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        
        // Exact title match gets highest priority
        const aExactTitle = aTitle === searchTerm ? 3 : 0;
        const bExactTitle = bTitle === searchTerm ? 3 : 0;
        
        // Title starts with search term gets second priority
        const aTitleStarts = aTitle.startsWith(searchTerm) ? 2 : 0;
        const bTitleStarts = bTitle.startsWith(searchTerm) ? 2 : 0;
        
        // Title contains search term gets third priority
        const aTitleContains = aTitle.includes(searchTerm) ? 1 : 0;
        const bTitleContains = bTitle.includes(searchTerm) ? 1 : 0;
        
        const aScore = aExactTitle + aTitleStarts + aTitleContains;
        const bScore = bExactTitle + bTitleStarts + bTitleContains;
        
        return bScore - aScore;
      });
      
      setPosts(sortedPosts);
    } else {
      // When search is cleared, restore all loaded posts
      setPosts(allPosts);
    }
  }, [allPosts, searchQuery, categories, tags]);

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
      console.log('Scroll Debug:', {
        scrollLeft,
        scrollWidth,
        clientWidth,
        hasOverflow,
        categoriesCount: parentCategories.length
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

  // Filter parent categories (those without parentId)
  const parentCategories = categories.filter(category => 
    !category.parentId // This handles null, undefined, empty string, etc.
  );

  // Chunk posts for repeating structure
  const chunkSections = (arr: Post[], chunkSize: number, sliderSize: number) => {
    const sections = [];
    let i = 0;
    while (i < arr.length) {
      const section = arr.slice(i, i + chunkSize);
      i += chunkSize;
      const slider = arr.slice(i, i + sliderSize);
      i += sliderSize;
      sections.push({ section, slider });
    }
    return sections;
  };

  // Each section: 1 main, 2 small, headlines; then a slider of 4
  const sections = chunkSections(posts, 3, 4);

  // Helper to get sidebar headlines (next 4 posts after the 3 in section)
  const getSidebarStories = (startIdx: number) => posts.slice(startIdx + 3, startIdx + 7);

  // After the first main+2+headlines+carousel, show a modern 3-column layout for the next up to 11 posts (or fewer if not enough)
  const modernStartIdx = 3 + 4; // skip first 3 (main+2) and 4 (carousel)
  const modernPosts = posts.slice(modernStartIdx, modernStartIdx + 11); // 1+3+1+2+1+3 = 11
  // Left: 1 large + 3 small, Center: 1 extra-large + 2 small, Right: 1 large + 3 small
  const leftLarge = modernPosts[0];
  const leftSmall = modernPosts.slice(1, 4);
  const centerXL = modernPosts[4];
  const centerSmall = modernPosts.slice(5, 7);
  const rightLarge = modernPosts[7];
  const rightSmall = modernPosts.slice(8, 11);
  // Posts after the modern 3-column layout
  const afterModernIdx = modernStartIdx + modernPosts.length;
  const remainingPosts = posts.slice(afterModernIdx);

  // Handle image load error - placeholder function (logic moved to backend)
  const handleImageError = (postId: string) => {
    // Image error handling moved to backend
  };

  // Handle search query
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-900 w-full overflow-x-hidden">
      {/* Preload critical images for better LCP */}
      {sections.length > 0 && sections[0].section[0] && getPostImage(sections[0].section[0]) && (
        <ImagePreloader 
          imageUrl={getPostImage(sections[0].section[0])!} 
          priority={true}
          preloadMultiple={
            // Preload first 3 images from the first section
            sections[0].section.slice(0, 3)
              .map(post => getPostImage(post))
              .filter(Boolean) as string[]
          }
        />
      )}
      <div className="flex-grow w-full">
        <div className="w-full max-w-7xl mx-auto py-6 px-3 sm:px-4 md:px-6 lg:px-8 min-w-0">
          {/* Header */}
          <header className="mb-4 border-b pb-4 w-full">
            {/* Center Content */}
            <div className="text-center mb-4">
              <h1 className="text-4xl md:text-5xl font-serif font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6">
                <Link href="/" className="hover:opacity-80 transition-opacity cursor-pointer">
                  Handicap International
                </Link>
              </h1>
            </div>
            
            {/* Date and Search Bar Row */}
            <div className="flex items-center justify-center relative">
              <div className="text-zinc-500 dark:text-zinc-400 text-sm">
                {mounted ? new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
              </div>
              <div className="absolute right-0">
                <SearchBar onSearch={handleSearch} />
              </div>
            </div>
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
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 whitespace-nowrap inline-block`}
                        prefetch={true}
                      >
                        Tout
                      </Link>
                    </NavigationMenuItem>

                    {parentCategories.map(category => (
                      <NavigationMenuItem key={category._id}>
                        <Link
                          href={`/${category.slug}`}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 whitespace-nowrap inline-block`}
                          prefetch={true}
                        >
                          {category.name}
                        </Link>
                      </NavigationMenuItem>
                    ))}
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            </div>
          </nav>
          
          {/* Search Results Indicator */}
          {searchQuery && searchQuery.trim().length >= 2 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Résultats de recherche pour "{searchQuery}"
                  </h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {posts.length} article{posts.length !== 1 ? 's' : ''} trouvé{posts.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleSearch('')}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm font-medium"
                >
                  Effacer la recherche
                </button>
              </div>
            </div>
          )}
          
          {posts.length === 0 && searchQuery && searchQuery.trim().length >= 2 && (
            <div className="text-center py-12">
              <div className="text-zinc-500 dark:text-zinc-400 text-lg mb-2">
                Aucun article trouvé pour "{searchQuery}"
              </div>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm">
                Essayez avec d'autres mots-clés ou effacez la recherche pour voir tous les articles.
              </p>
            </div>
          )}
          
          {/* Search Results Layout */}
          {searchQuery && searchQuery.trim().length >= 2 && posts.length > 0 && (
            <div className="mb-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map(post => (
                  <div key={post._id || post.id} className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {getPostImage(post) && (
                      <LazyImage
                        src={getPostImage(post)!}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                        imageUrls={getPostImageWithFallbacks(post)}
                        onError={() => handleImageError(post._id || post.id)}
                      />
                    )}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                        <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-2 transition-all text-zinc-900 dark:text-zinc-100">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-3 mb-3 flex-1">
                        {getExcerptFromContent(post.content, 25)}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {getCategoryNames(post.categoryIds).slice(0, 2).map(name => (
                          <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
                        ))}
                        {getTagNames(post.tagIds).slice(0, 2).map(name => (
                          <Badge key={name} variant="default" className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">#{name}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {new Date(post.createdAt).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </div>
                        <Button asChild size="sm" variant="outline" className="text-xs">
                          <Link href={`/posts/${post.slug}`}>
                            Lire la suite
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Normal Layout - Only show when no search is active */}
          {(!searchQuery || searchQuery.trim().length < 2) && (
            <>
          {/* First main+2+headlines section */}
          {sections.length > 0 && (() => {
            const { section, slider } = sections[0];
            const mainStory = section[0];
            const secondaryStories = section.slice(1, 3);
            const sidebarStories = getSidebarStories(0);
            return (
              <div className="mb-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                  <div className="md:col-span-2 space-y-8">
                    {mainStory && (
                      <div className="flex flex-col border-b pb-6">
                        {/* <Badge className="mb-2 self-start" variant="secondary">Article Principal</Badge> */}
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                          <Link href={`/${mainStory.slug}`} className="hover:underline underline-offset-2 transition-all">{mainStory.title}</Link>
                        </h2>
                        {getPostImage(mainStory) && (
                          <LazyImage
                            src={getPostImage(mainStory)!}
                            alt={mainStory.title}
                            className="w-full h-80 object-cover rounded mb-4"
                            aspectRatio="16/9"
                            priority={true}
                            imageUrls={getPostImageWithFallbacks(mainStory)}
                            onError={() => handleImageError(mainStory._id || mainStory.id)}
                          />
                        )}
                        <p className="text-lg text-zinc-700 dark:text-zinc-300 mb-4 line-clamp-4">{getExcerptFromContent(mainStory.content, 40)}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {getCategoryNames(mainStory.categoryIds).map(name => (
                            <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
                          ))}
                          {getTagNames(mainStory.tagIds).map(name => (
                            <Badge key={name} variant="default" className="text-xs bg-indigo-100 text-indigo-800">#{name}</Badge>
                          ))}
                        </div>
                        <div className="text-zinc-500 text-xs mb-2">{new Date(mainStory.createdAt).toLocaleDateString()}</div>
                        <Button asChild size="sm" className="w-fit">
                          <Link href={`/${mainStory.slug}`} className="hover:underline underline-offset-2 transition-all">Lire la suite</Link>
                        </Button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {secondaryStories.map(post => (
                        <div key={post.id} className="flex flex-col border-b pb-4">
                          <LazyImage
                            src={getPostImage(post)!}
                            alt={post.title}
                            className="w-full h-40 object-cover rounded mb-2"
                            imageUrls={getPostImageWithFallbacks(post)}
                            onError={() => handleImageError(post._id || post.id)}
                          />
                          <h3 className="text-lg font-semibold mb-1">
                            <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-2 transition-all">{post.title}</Link>
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-1">
                            {getCategoryNames(post.categoryIds).map(name => (
                              <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
                            ))}
                            {getTagNames(post.tagIds).map(name => (
                              <Badge key={name} variant="default" className="text-xs bg-indigo-100 text-indigo-800">#{name}</Badge>
                            ))}
                          </div>
                          <div className="text-zinc-500 text-xs mb-1">{new Date(post.createdAt).toLocaleDateString()}</div>
                          <p className="text-zinc-700 dark:text-zinc-300 line-clamp-3 mb-2">{post.excerpt}</p>
                          <Button asChild size="sm" variant="link" className="p-0 h-auto">
                            <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-2 transition-all">Lire la suite</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <aside className="space-y-6 md:mt-24">
                    <div className="border-b pb-4">
                      <h3 className="font-bold mb-2 text-zinc-800 dark:text-zinc-100">Dernières Nouvelles</h3>
                      <ul className="space-y-2">
                        {sidebarStories.map(post => (
                          <li key={post.id} className="flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-2 transition-all font-semibold line-clamp-2">
                                {post.title}
                              </Link>
                              <div className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 mb-1">
                                {getExcerptFromContent(post.content)}
                              </div>
                              <div className="flex flex-wrap gap-1 mb-1">
                                {getCategoryNames(post.categoryIds).map(name => (
                                  <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
                                ))}
                                {getTagNames(post.tagIds).map(name => (
                                  <Badge key={name} variant="default" className="text-xs bg-indigo-100 text-indigo-800">#{name}</Badge>
                                ))}
                              </div>
                              <div className="text-xs text-zinc-400">{new Date(post.createdAt).toLocaleDateString()}</div>
                            </div>
                            {getPostImage(post) && (
                              <LazyImage
                                src={getPostImage(post)!}
                                alt={post.title}
                                className="w-20 h-20 object-cover rounded ml-2 flex-shrink-0 border"
                                imageUrls={getPostImageWithFallbacks(post)}
                                onError={() => handleImageError(post.id)}
                              />
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Advertisement container */}
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg flex flex-col items-center py-6 mt-6">
                      <AdPlaceholder width={300} height={180} className="w-full max-w-[300px]" />
                    </div>
                  </aside>
                </div>
                {/* Carousel slider */}
                {slider.length > 0 && (
                  <div className="my-12">
                    <Carousel>
                      <CarouselContent>
                        {slider.map(post => (
                          <CarouselItem key={post.id} className="basis-1/2 md:basis-1/4">
                            <div className="flex flex-col h-full border rounded-md p-2 bg-white dark:bg-zinc-900">
                              {getPostImage(post) && (
                                <LazyImage
                                  src={getPostImage(post)!}
                                  alt={post.title}
                                  className="w-full h-40 object-cover rounded mb-2"
                                  imageUrls={getPostImageWithFallbacks(post)}
                                  onError={() => handleImageError(post.id)}
                                />
                              )}
                              <h4 className="text-md font-semibold mb-1">
                                <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-2 transition-all">{post.title}</Link>
                              </h4>
                              <div className="flex flex-wrap gap-2 mb-1">
                                {getCategoryNames(post.categoryIds).map(name => (
                                  <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
                                ))}
                                {getTagNames(post.tagIds).map(name => (
                                  <Badge key={name} variant="default" className="text-xs bg-indigo-100 text-indigo-800">#{name}</Badge>
                                ))}
                              </div>
                              <div className="text-zinc-500 text-xs mb-1">{new Date(post.createdAt).toLocaleDateString()}</div>
                              <p className="text-zinc-700 dark:text-zinc-300 line-clamp-2 mb-2">{post.excerpt}</p>
                              <Button asChild size="sm" variant="link" className="p-0 h-auto">
                                <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-2 transition-all">Lire la suite</Link>
                              </Button>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </Carousel>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Modern 3-column layout after carousel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left column */}
            <div className="flex flex-col gap-6">
              {leftLarge && (
                <div className="mb-2">
                  {getPostImage(leftLarge) && (
                    <LazyImage
                      src={getPostImage(leftLarge)!}
                      alt={leftLarge.title}
                      className="w-full h-48 object-cover rounded mb-2"
                      imageUrls={getPostImageWithFallbacks(leftLarge)}
                      onError={() => handleImageError(leftLarge.id)}
                    />
                  )}
                  <h3 className="text-xl font-bold mb-1">
                    <Link href={`/${leftLarge.slug}`} className="hover:underline underline-offset-2 transition-all">{leftLarge.title}</Link>
                  </h3>
                </div>
              )}
              {leftSmall.map(post => (
                <div key={post.id} className="flex gap-3 items-center border-b pb-2">
                  {getPostImage(post) && (
                    <LazyImage
                      src={getPostImage(post)!}
                      alt={post.title}
                      className="w-16 h-16 object-cover rounded"
                      imageUrls={getPostImageWithFallbacks(post)}
                      onError={() => handleImageError(post.id)}
                    />
                  )}
                  <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-2 transition-all font-medium line-clamp-2">{post.title}</Link>
                </div>
              ))}
            </div>
            {/* Center column */}
            <div className="flex flex-col gap-6">
              {centerXL && (
                <div className="mb-2">
                  {getPostImage(centerXL) && (
                    <LazyImage
                      src={getPostImage(centerXL)!}
                      alt={centerXL.title}
                      className="w-full h-64 object-cover rounded mb-2"
                      imageUrls={getPostImageWithFallbacks(centerXL)}
                      onError={() => handleImageError(centerXL.id)}
                    />
                  )}
                  <h2 className="text-2xl font-bold mb-1">
                    <Link href={`/${centerXL.slug}`} className="hover:underline underline-offset-2 transition-all">{centerXL.title}</Link>
                  </h2>
                  <div className="text-xs text-zinc-500 mb-1">By Unknown | {new Date(centerXL.createdAt).toLocaleDateString()}</div>
                </div>
              )}
              {centerSmall.map(post => (
                <div key={post.id} className="flex gap-3 items-center border-b pb-2">
                  {getPostImage(post) && (
                    <LazyImage
                      src={getPostImage(post)!}
                      alt={post.title}
                      className="w-16 h-16 object-cover rounded"
                      imageUrls={getPostImageWithFallbacks(post)}
                      onError={() => handleImageError(post.id)}
                    />
                  )}
                  <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-2 transition-all font-medium line-clamp-2">{post.title}</Link>
                </div>
              ))}
            </div>
            {/* Right column */}
            <div className="flex flex-col gap-6">
              {rightLarge && (
                <div className="mb-2">
                  {getPostImage(rightLarge) && (
                    <LazyImage
                      src={getPostImage(rightLarge)!}
                      alt={rightLarge.title}
                      className="w-full h-48 object-cover rounded mb-2"
                      imageUrls={getPostImageWithFallbacks(rightLarge)}
                      onError={() => handleImageError(rightLarge.id)}
                    />
                  )}
                  <h3 className="text-xl font-bold mb-1">
                    <Link href={`/${rightLarge.slug}`} className="hover:underline underline-offset-2 transition-all">{rightLarge.title}</Link>
                  </h3>
                </div>
              )}
              {rightSmall.map(post => (
                <div key={post.id} className="flex gap-3 items-center border-b pb-2">
                  {getPostImage(post) && (
                    <LazyImage
                      src={getPostImage(post)!}
                      alt={post.title}
                      className="w-16 h-16 object-cover rounded"
                      imageUrls={getPostImageWithFallbacks(post)}
                      onError={() => handleImageError(post.id)}
                    />
                  )}
                  <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-2 transition-all font-medium line-clamp-2">{post.title}</Link>
                </div>
              ))}
            </div>
          </div>

          {/* Advertisement container */}
          <div className="my-12 w-full">
            <div className="w-full max-w-7xl mx-auto bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg flex flex-col items-center py-8">
              <AdPlaceholder width={1200} height={120} className="w-full max-w-5xl" />
            </div>
          </div>

          {/* More posts after ad banner, in modern 3-column layout chunks */}
          {remainingPosts.length > 0 && (
            <div className="max-w-7xl mx-auto mt-12 space-y-16">
              {Array.from({ length: Math.ceil(remainingPosts.length / 11) }).map((_, i) => {
                const chunk = remainingPosts.slice(i * 11, (i + 1) * 11);
                const leftLarge = chunk[0];
                const leftSmall = chunk.slice(1, 4);
                const centerXL = chunk[4];
                const centerSmall = chunk.slice(5, 7);
                const rightLarge = chunk[7];
                const rightSmall = chunk.slice(8, 11);
                return (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left column */}
                    <div className="flex flex-col gap-6">
                      {leftLarge && (
                        <div className="mb-2">
                          {getPostImage(leftLarge) && (
                            <LazyImage
                              src={getPostImage(leftLarge)!}
                              alt={leftLarge.title}
                              className="w-full h-48 object-cover rounded mb-2"
                              imageUrls={getPostImageWithFallbacks(leftLarge)}
                              onError={() => handleImageError(leftLarge.id)}
                            />
                          )}
                          <h3 className="text-xl font-bold mb-1">
                            <Link href={`/${leftLarge.slug}`} className="hover:underline underline-offset-2 transition-all">{leftLarge.title}</Link>
                          </h3>
                        </div>
                      )}
                      {leftSmall.map(post => (
                        <div key={post.id} className="flex gap-3 items-center border-b pb-2">
                          {getPostImage(post) && (
                            <LazyImage
                              src={getPostImage(post)!}
                              alt={post.title}
                              className="w-16 h-16 object-cover rounded"
                              imageUrls={getPostImageWithFallbacks(post)}
                              onError={() => handleImageError(post.id)}
                            />
                          )}
                          <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-2 transition-all font-medium line-clamp-2">{post.title}</Link>
                        </div>
                      ))}
                    </div>
                    {/* Center column */}
                    <div className="flex flex-col gap-6">
                      {centerXL && (
                        <div className="mb-2">
                          {getPostImage(centerXL) && (
                            <LazyImage
                              src={getPostImage(centerXL)!}
                              alt={centerXL.title}
                              className="w-full h-64 object-cover rounded mb-2"
                              imageUrls={getPostImageWithFallbacks(centerXL)}
                              onError={() => handleImageError(centerXL.id)}
                            />
                          )}
                          <h2 className="text-2xl font-bold mb-1">
                            <Link href={`/${centerXL.slug}`} className="hover:underline underline-offset-2 transition-all">{centerXL.title}</Link>
                          </h2>
                          <div className="text-xs text-zinc-500 mb-1">By Unknown | {new Date(centerXL.createdAt).toLocaleDateString()}</div>
                        </div>
                      )}
                      {centerSmall.map(post => (
                        <div key={post.id} className="flex gap-3 items-center border-b pb-2">
                          {getPostImage(post) && (
                            <LazyImage
                              src={getPostImage(post)!}
                              alt={post.title}
                              className="w-16 h-16 object-cover rounded"
                              imageUrls={getPostImageWithFallbacks(post)}
                              onError={() => handleImageError(post.id)}
                            />
                          )}
                          <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-2 transition-all font-medium line-clamp-2">{post.title}</Link>
                        </div>
                      ))}
                    </div>
                    {/* Right column */}
                    <div className="flex flex-col gap-6">
                      {rightLarge && (
                        <div className="mb-2">
                          {getPostImage(rightLarge) && (
                            <LazyImage
                              src={getPostImage(rightLarge)!}
                              alt={rightLarge.title}
                              className="w-full h-48 object-cover rounded mb-2"
                              imageUrls={getPostImageWithFallbacks(rightLarge)}
                              onError={() => handleImageError(rightLarge.id)}
                            />
                          )}
                          <h3 className="text-xl font-bold mb-1">
                            <Link href={`/${rightLarge.slug}`} className="hover:underline underline-offset-2 transition-all">{rightLarge.title}</Link>
                          </h3>
                        </div>
                      )}
                      {rightSmall.map(post => (
                        <div key={post.id} className="flex gap-3 items-center border-b pb-2">
                          {getPostImage(post) && (
                            <LazyImage
                              src={getPostImage(post)!}
                              alt={post.title}
                              className="w-16 h-16 object-cover rounded"
                              imageUrls={getPostImageWithFallbacks(post)}
                              onError={() => handleImageError(post.id)}
                            />
                          )}
                          <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-2 transition-all font-medium line-clamp-2">{post.title}</Link>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </>
          )} 
        {/* loading skeletons */}
        {isLoading && !searchQuery.trim() && (
          <div className="max-w-7xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonPost key={i} />
            ))}
          </div>
        )}
        {/* sentinel for infinite scroll */}
        <div ref={loaderRef} className="h-px w-full" />
        </div>
      </div>
    </div>
  );
}