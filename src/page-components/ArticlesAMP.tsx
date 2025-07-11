'use client';

import { useState, useEffect, useRef } from 'react';
import { Post, Category } from '../types/post';

const imageBaseUrl = 'https://handicap-internatioanl.fr';

function getPostImage(post: Post): string | null {
  if (Array.isArray(post.image_urls) && post.image_urls.length > 0) {
    const imagePath = post.image_urls[0];
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `${imageBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  }
  return null;
}

function getExcerptFromContent(html: string, wordCount = 25): string {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return text.split(/\s+/).slice(0, wordCount).join(' ') + (text.split(/\s+/).length > wordCount ? '...' : '');
}

// Chunk posts for magazine layout (similar to ArticlesSSR)
function chunkSections(arr: Post[], chunkSize: number, sliderSize: number) {
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
}

// Helper to get sidebar headlines
function getSidebarStories(posts: Post[], startIdx: number): Post[] {
  return posts.slice(startIdx + 3, startIdx + 7);
}

interface Pagination {
  currentPage: number;
  totalPages: number;
}

interface ArticlesAMPProps {
  initialPosts: Post[];
  categories: Category[];
  initialPagination: Pagination;
}

export default function ArticlesAMP({ initialPosts, categories, initialPagination }: ArticlesAMPProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Infinite scroll logic with 10 post limit
  const fetchMorePosts = async () => {
    if (isLoading || pagination.currentPage >= pagination.totalPages) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextPage = pagination.currentPage + 1;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/posts?page=${nextPage}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const newData = await response.json();
      const newPosts = newData.data || [];

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
        if (first.isIntersecting && !isLoading) {
          fetchMorePosts();
        }
      },
      { rootMargin: '1000px' }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loaderRef.current, isLoading, pagination]);

  // Check scroll state for navigation arrows
  const checkScrollState = () => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      const hasOverflow = scrollWidth > clientWidth;
      
      setShowLeftArrow(scrollLeft > 5);
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

  // Initialize scroll state
  useEffect(() => {
    const timer = setTimeout(() => {
      checkScrollState();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Add resize listener
  useEffect(() => {
    const handleResize = () => {
      checkScrollState();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const parentCategories = categories.filter(category => !category.parentId);
  
  // Apply magazine layout logic similar to ArticlesSSR
  const sections = chunkSections(posts, 3, 4);
  
  // Extract posts for different layout sections
  const mainStory = sections.length > 0 ? sections[0].section[0] : null;
  const secondaryStories = sections.length > 0 ? sections[0].section.slice(1, 3) : [];
  const sidebarStories = sections.length > 0 ? getSidebarStories(posts, 0) : [];
  const carouselPosts = sections.length > 0 ? sections[0].slider : [];
  
  // Modern 3-column layout posts (after first section)
  const modernStartIdx = 3 + 4; // skip first 3 (main+2) and 4 (carousel)
  const modernPosts = posts.slice(modernStartIdx, modernStartIdx + 11); // Use same as ArticlesSSR
  const leftLarge = modernPosts[0];
  const leftSmall = modernPosts.slice(1, 4); // Same as ArticlesSSR
  const centerXL = modernPosts[4];
  const centerSmall = modernPosts.slice(5, 7);
  const rightLarge = modernPosts[7];
  const rightSmall = modernPosts.slice(8, 11);
  
  // Posts after the modern 3-column layout (for infinite scroll)
  const afterModernIdx = modernStartIdx + modernPosts.length;
  const remainingPosts = posts.slice(afterModernIdx);

  // Skeleton loading component
  const SkeletonPost = () => (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      animation: 'pulse 1.5s ease-in-out infinite'
    }}>
      <div style={{
        width: '100%',
        height: '192px',
        background: '#e5e5e5',
        borderRadius: '8px'
      }}></div>
      <div style={{
        height: '16px',
        background: '#e5e5e5',
        borderRadius: '4px',
        width: '75%'
      }}></div>
      <div style={{
        height: '16px',
        background: '#e5e5e5',
        borderRadius: '4px',
        width: '50%'
      }}></div>
    </div>
  );

  return (
    <>
      {/* Header */}
      <header style={{ 
        marginBottom: '32px', 
        textAlign: 'center',
        padding: '32px 32px 0 32px'
      }}>
        <h1 style={{
          fontSize: '40px',
          fontWeight: 'bold',
          letterSpacing: '-0.025em',
          color: '#000',
          marginBottom: '12px',
          lineHeight: '1.1',
          margin: '4px auto 12px auto'
        }}>
          <a href="/" style={{ 
            textDecoration: 'none', 
            color: 'inherit',
            transition: 'opacity 0.2s'
          }}>
            Handicap International
          </a>
        </h1>
        <div style={{
          color: '#6b7280',
          fontSize: '14px',
          marginBottom: '24px',
          paddingBottom: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
      </header>

      {/* Sidebar - Using regular div for now */}
      <div id="sidebar" style={{ display: 'none' }}>
        <div className="sidebar-header">
          <span className="logo">Menu</span>
          <button 
            className="sidebar-close"
            role="button"
            tabIndex={0}
          >
            ✕
          </button>
        </div>
        <nav>
          <ul className="sidebar-nav">
            <li><a href="/">Accueil</a></li>
            {parentCategories.map(category => (
              <li key={category._id}>
                <a href={`/${category.slug}`}>{category.name}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Navigation Categories */}
      <nav style={{ 
        marginBottom: '32px', 
        position: 'relative', 
        maxWidth: '1024px', 
        margin: '0 auto 32px auto' 
      }}>
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={scrollLeft}
            style={{
              position: 'absolute',
              left: '1px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: '20',
              background: '#fff',
              borderRadius: '50%',
              padding: '0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s',
              width: '40px',
              height: '40px',
              minWidth: '40px',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: '0'
            }}
            aria-label="Scroll left"
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <span style={{ 
              fontSize: '20px', 
              color: '#374151', 
              fontWeight: 'bold', 
              lineHeight: '1',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>&#8249;</span>
          </button>
        )}
        
        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={scrollRight}
            style={{
              position: 'absolute',
              right: '1px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: '20',
              background: '#fff',
              borderRadius: '50%',
              padding: '0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s',
              width: '40px',
              height: '40px',
              minWidth: '40px',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: '0'
            }}
            aria-label="Scroll right"
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <span style={{ 
              fontSize: '20px', 
              color: '#374151', 
              fontWeight: 'bold', 
              lineHeight: '1',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>&#8250;</span>
          </button>
        )}

        <div 
          ref={navRef}
          className="scrollbar-hide"
          style={{
            overflowX: 'auto',
            padding: '0 32px'
          }}
          onScroll={checkScrollState}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            minWidth: 'max-content' 
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '24px', 
              minWidth: 'max-content' 
            }}>
              <a 
                href="/" 
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'color 0.2s',
                  borderBottom: '2px solid #000',
                  paddingBottom: '4px'
                }}
              >
                TOUT
              </a>
              {parentCategories.slice(0, 8).map(category => (
                <a 
                  key={category._id} 
                  href={`/${category.slug}`} 
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    transition: 'color 0.2s'
                  }}
                >
                  {category.name.toUpperCase()}
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container">
        {/* Magazine Layout - Hero Section with Secondary Posts and Sidebar */}
        {mainStory && (
          <section style={{ marginBottom: '40px' }}>
            <div className="magazine-hero" style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr',
              gap: '20px'
            }}>
              {/* Mobile: Stack vertically, Desktop: 2fr 1fr */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '20px'
              }}>
                {/* Main Story */}
                <article style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: '20px' }}>
                  {getPostImage(mainStory) && (
                    <img
                      src={getPostImage(mainStory)!}
                      alt={mainStory.title}
                      style={{ 
                        width: '100%',
                        height: 'auto',
                        maxHeight: '400px',
                        objectFit: 'cover',
                        borderRadius: '8px', 
                        marginBottom: '16px' 
                      }}
                    />
                  )}
                  <h1 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    lineHeight: '1.3',
                    margin: '0 0 12px 0',
                    color: '#333'
                  }}>
                    <a href={`/posts/${mainStory.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {mainStory.title}
                    </a>
                  </h1>
                  <p style={{
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: '#666',
                    margin: '0 0 16px 0'
                  }}>
                    {getExcerptFromContent(mainStory.content, 40)}
                  </p>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#999',
                    marginBottom: '12px'
                  }}>
                    {new Date(mainStory.createdAt).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </div>
                  <a href={`/posts/${mainStory.slug}`} className="read-more">
                    Lire la suite
                  </a>
                </article>

                {/* Secondary Stories */}
                {secondaryStories.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '16px'
                  }}>
                    {secondaryStories.map(post => (
                      <article key={post._id || post.id} style={{
                        display: 'flex',
                        gap: '12px',
                        borderBottom: '1px solid #f0f0f0',
                        paddingBottom: '16px'
                      }}>
                        {getPostImage(post) && (
                          <img
                            src={getPostImage(post)!}
                            alt={post.title}
                            style={{ 
                              width: '120px',
                              height: '80px',
                              objectFit: 'cover',
                              borderRadius: '6px', 
                              flexShrink: '0' 
                            }}
                          />
                        )}
                        <div style={{ flex: '1', minWidth: '0' }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            lineHeight: '1.4',
                            margin: '0 0 8px 0'
                          }}>
                            <a href={`/posts/${post.slug}`} style={{ textDecoration: 'none', color: '#333' }}>
                              {post.title}
                            </a>
                          </h3>
                          <p style={{
                            fontSize: '14px',
                            color: '#666',
                            margin: '0 0 8px 0',
                            display: '-webkit-box',
                            WebkitLineClamp: '2',
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {getExcerptFromContent(post.content, 15)}
                          </p>
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            {new Date(post.createdAt).toLocaleDateString('fr-FR', { 
                              day: 'numeric', 
                              month: 'short',
                              year: 'numeric' 
                            })}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar Headlines */}
              {sidebarStories.length > 0 && (
                <aside style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  marginTop: '20px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: '0 0 16px 0',
                    color: '#333'
                  }}>
                    Dernières Nouvelles
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sidebarStories.map(post => (
                      <article key={post._id || post.id} style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: '1', minWidth: '0' }}>
                          <h4 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            lineHeight: '1.4',
                            margin: '0 0 4px 0'
                          }}>
                            <a href={`/posts/${post.slug}`} style={{ textDecoration: 'none', color: '#333' }}>
                              {post.title}
                            </a>
                          </h4>
                          <p style={{
                            fontSize: '12px',
                            color: '#666',
                            margin: '0 0 4px 0',
                            display: '-webkit-box',
                            WebkitLineClamp: '2',
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {getExcerptFromContent(post.content, 12)}
                          </p>
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            {new Date(post.createdAt).toLocaleDateString('fr-FR', { 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </div>
                        </div>
                        {getPostImage(post) && (
                          <img
                            src={getPostImage(post)!}
                            alt={post.title}
                            style={{ 
                              width: '60px',
                              height: '60px',
                              objectFit: 'cover',
                              borderRadius: '6px', 
                              flexShrink: '0' 
                            }}
                          />
                        )}
                      </article>
                    ))}
                  </div>
                </aside>
              )}
            </div>
          </section>
        )}

        {/* Featured Section */}
        {carouselPosts.length > 0 && (
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              margin: '0 0 20px 0',
              color: '#333'
            }}>
              À la Une
            </h2>
            <div style={{
              width: '100%',
              height: '300px',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '8px'
            }}>
              {carouselPosts.slice(0, 1).map(post => (
                <div key={post._id || post.id} style={{
                  position: 'relative',
                  width: '100%',
                  height: '300px',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  {getPostImage(post) && (
                    <img
                      src={getPostImage(post)!}
                      alt={post.title}
                      style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    padding: '20px',
                    color: '#fff'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      margin: '0 0 8px 0',
                      lineHeight: '1.3'
                    }}>
                      <a href={`/posts/${post.slug}`} style={{ color: '#fff', textDecoration: 'none' }}>
                        {post.title}
                      </a>
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      margin: '0 0 8px 0',
                      opacity: '0.9'
                    }}>
                      {getExcerptFromContent(post.content, 15)}
                    </p>
                    <div style={{ fontSize: '12px', opacity: '0.8' }}>
                      {new Date(post.createdAt).toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Modern 3-Column Layout */}
        {leftLarge && (
          <section style={{ marginBottom: '40px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '24px'
            }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {leftLarge && (
                  <article style={{ marginBottom: '16px' }}>
                    {getPostImage(leftLarge) && (
                      <img
                        src={getPostImage(leftLarge)!}
                        alt={leftLarge.title}
                        style={{ 
                          width: '100%',
                          height: 'auto',
                          maxHeight: '250px',
                          objectFit: 'cover',
                          borderRadius: '8px', 
                          marginBottom: '12px' 
                        }}
                      />
                    )}
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      margin: '0 0 8px 0',
                      lineHeight: '1.3'
                    }}>
                      <a href={`/posts/${leftLarge.slug}`} style={{ textDecoration: 'none', color: '#333' }}>
                        {leftLarge.title}
                      </a>
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#666',
                      margin: '0 0 8px 0'
                    }}>
                      {getExcerptFromContent(leftLarge.content, 20)}
                    </p>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(leftLarge.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </article>
                )}
                
                {leftSmall.map(post => (
                  <article key={post._id || post.id} style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    borderBottom: '1px solid #f0f0f0',
                    paddingBottom: '12px'
                  }}>
                    {getPostImage(post) && (
                      <img
                        src={getPostImage(post)!}
                        alt={post.title}
                        style={{ 
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '6px', 
                          flexShrink: '0' 
                        }}
                      />
                    )}
                    <div style={{ flex: '1', minWidth: '0' }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        margin: '0 0 4px 0',
                        lineHeight: '1.4'
                      }}>
                        <a href={`/posts/${post.slug}`} style={{ textDecoration: 'none', color: '#333' }}>
                          {post.title}
                        </a>
                      </h4>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {new Date(post.createdAt).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Center Column (Desktop only) */}
              {centerXL && (
                <div style={{ 
                  display: 'none',
                  flexDirection: 'column', 
                  gap: '16px'
                }}>
                  <article style={{ marginBottom: '16px' }}>
                    {getPostImage(centerXL) && (
                      <img
                        src={getPostImage(centerXL)!}
                        alt={centerXL.title}
                        style={{ 
                          width: '100%',
                          height: '300px',
                          objectFit: 'cover',
                          borderRadius: '8px', 
                          marginBottom: '12px' 
                        }}
                      />
                    )}
                    <h2 style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      margin: '0 0 8px 0',
                      lineHeight: '1.3'
                    }}>
                      <a href={`/posts/${centerXL.slug}`} style={{ textDecoration: 'none', color: '#333' }}>
                        {centerXL.title}
                      </a>
                    </h2>
                    <p style={{
                      fontSize: '16px',
                      color: '#666',
                      margin: '0 0 8px 0'
                    }}>
                      {getExcerptFromContent(centerXL.content, 25)}
                    </p>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                      {new Date(centerXL.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </article>
                  
                  {centerSmall.map(post => (
                    <article key={post._id || post.id} style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      borderBottom: '1px solid #f0f0f0',
                      paddingBottom: '12px'
                    }}>
                      {getPostImage(post) && (
                        <img
                          src={getPostImage(post)!}
                          alt={post.title}
                          style={{ 
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '6px', 
                            flexShrink: '0' 
                          }}
                        />
                      )}
                      <div style={{ flex: '1', minWidth: '0' }}>
                        <h4 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          margin: '0 0 4px 0',
                          lineHeight: '1.4'
                        }}>
                          <a href={`/posts/${post.slug}`} style={{ textDecoration: 'none', color: '#333' }}>
                            {post.title}
                          </a>
                        </h4>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          {new Date(post.createdAt).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Right Column (Desktop only) */}
              {rightLarge && (
                <div style={{ 
                  display: 'none',
                  flexDirection: 'column', 
                  gap: '16px'
                }}>
                  <article style={{ marginBottom: '16px' }}>
                    {getPostImage(rightLarge) && (
                      <img
                        src={getPostImage(rightLarge)!}
                        alt={rightLarge.title}
                        style={{ 
                          width: '100%',
                          height: 'auto',
                          maxHeight: '250px',
                          objectFit: 'cover',
                          borderRadius: '8px', 
                          marginBottom: '12px' 
                        }}
                      />
                    )}
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      margin: '0 0 8px 0',
                      lineHeight: '1.3'
                    }}>
                      <a href={`/posts/${rightLarge.slug}`} style={{ textDecoration: 'none', color: '#333' }}>
                        {rightLarge.title}
                      </a>
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#666',
                      margin: '0 0 8px 0'
                    }}>
                      {getExcerptFromContent(rightLarge.content, 20)}
                    </p>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(rightLarge.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </article>
                  
                  {rightSmall.map(post => (
                    <article key={post._id || post.id} style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      borderBottom: '1px solid #f0f0f0',
                      paddingBottom: '12px'
                    }}>
                      {getPostImage(post) && (
                        <img
                          src={getPostImage(post)!}
                          alt={post.title}
                          style={{ 
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '6px', 
                            flexShrink: '0' 
                          }}
                        />
                      )}
                      <div style={{ flex: '1', minWidth: '0' }}>
                        <h4 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          margin: '0 0 4px 0',
                          lineHeight: '1.4'
                        }}>
                          <a href={`/posts/${post.slug}`} style={{ textDecoration: 'none', color: '#333' }}>
                            {post.title}
                          </a>
                        </h4>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          {new Date(post.createdAt).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Remaining Posts in 3-Column Layout (for infinite scroll) */}
        {remainingPosts.length > 0 && (
          <section style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {Array.from({ length: Math.ceil(remainingPosts.length / 11) }).map((_, i) => {
                const chunk = remainingPosts.slice(i * 11, (i + 1) * 11);
                const chunkLeftLarge = chunk[0];
                const chunkLeftSmall = chunk.slice(1, 4);
                const chunkCenterXL = chunk[4];
                const chunkCenterSmall = chunk.slice(5, 7);
                const chunkRightLarge = chunk[7];
                const chunkRightSmall = chunk.slice(8, 11);
                
                return (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '24px'
                  }}>
                    {/* Left Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {chunkLeftLarge && (
                        <article style={{ marginBottom: '16px' }}>
                          {getPostImage(chunkLeftLarge) && (
                            <img
                              src={getPostImage(chunkLeftLarge)!}
                              alt={chunkLeftLarge.title}
                              style={{ 
                                width: '100%',
                                height: 'auto',
                                maxHeight: '250px',
                                objectFit: 'cover',
                                borderRadius: '8px', 
                                marginBottom: '12px' 
                              }}
                            />
                          )}
                          <h3 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            margin: '0 0 8px 0',
                            lineHeight: '1.3'
                          }}>
                            <a href={`/posts/${chunkLeftLarge.slug}`} style={{ textDecoration: 'none', color: '#333' }}>
                              {chunkLeftLarge.title}
                            </a>
                          </h3>
                          <p style={{
                            fontSize: '14px',
                            color: '#666',
                            margin: '0 0 8px 0'
                          }}>
                            {getExcerptFromContent(chunkLeftLarge.content, 20)}
                          </p>
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            {new Date(chunkLeftLarge.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </article>
                      )}
                      
                      {chunkLeftSmall.map(post => (
                        <article key={post._id || post.id} style={{
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-start',
                          borderBottom: '1px solid #f0f0f0',
                          paddingBottom: '12px'
                        }}>
                          {getPostImage(post) && (
                            <img
                              src={getPostImage(post)!}
                              alt={post.title}
                              style={{ 
                                width: '80px',
                                height: '80px',
                                objectFit: 'cover',
                                borderRadius: '6px', 
                                flexShrink: '0' 
                              }}
                            />
                          )}
                          <div style={{ flex: '1', minWidth: '0' }}>
                            <h4 style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              margin: '0 0 4px 0',
                              lineHeight: '1.4'
                            }}>
                              <a href={`/posts/${post.slug}`} style={{ textDecoration: 'none', color: '#333' }}>
                                {post.title}
                              </a>
                            </h4>
                            <div style={{ fontSize: '12px', color: '#999' }}>
                              {new Date(post.createdAt).toLocaleDateString('fr-FR', { 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Skeleton Loading */}
        {isLoading && (
          <section style={{ marginBottom: '40px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '24px'
            }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonPost key={i} />
              ))}
            </div>
          </section>
        )}

        {/* Infinite Scroll Trigger */}
        <div 
          ref={loaderRef} 
          style={{ 
            height: '20px', 
            margin: '20px 0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {isLoading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#666',
              fontSize: '14px'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #333',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Chargement...
            </div>
          )}
          {error && (
            <div style={{
              color: '#dc2626',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              Erreur: {error}
            </div>
          )}
        </div>

        {/* End of posts indicator */}
        {pagination.currentPage >= pagination.totalPages && posts.length > 10 && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: '#666',
            fontSize: '14px',
            borderTop: '1px solid #e5e5e5',
            marginTop: '20px'
          }}>
            Vous avez vu tous les articles disponibles
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: '#f8f9fa',
        padding: '40px 0',
        textAlign: 'center',
        marginTop: '60px',
        borderTop: '1px solid #e5e5e5'
      }}>
        <div className="container">
          <p style={{ 
            margin: '0 0 16px 0', 
            fontSize: '18px', 
            fontWeight: '600',
            color: '#333'
          }}>
            Handicap International
          </p>
          <p style={{ 
            margin: '0', 
            fontSize: '14px', 
            color: '#666' 
          }}>
            © {new Date().getFullYear()} Tous droits réservés. 
            Version mobile optimisée.
          </p>
          <div style={{ marginTop: '16px' }}>
            <a 
              href="/" 
              style={{ 
                color: '#333', 
                textDecoration: 'none', 
                fontSize: '14px',
                marginRight: '16px'
              }}
            >
              Version complète
            </a>
            <a 
              href="/privacy" 
              style={{ 
                color: '#333', 
                textDecoration: 'none', 
                fontSize: '14px' 
              }}
            >
              Politique de confidentialité
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}