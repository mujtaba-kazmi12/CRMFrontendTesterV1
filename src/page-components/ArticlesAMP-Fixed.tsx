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

interface ArticlesAMPProps {
  posts: Post[];
  categories: Category[];
}

export default function ArticlesAMP({ posts, categories }: ArticlesAMPProps) {
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
  const modernPosts = posts.slice(modernStartIdx, modernStartIdx + 9); // Reduced from 11 to 9 for AMP
  const leftLarge = modernPosts[0];
  const leftSmall = modernPosts.slice(1, 3); // Reduced from 3 to 2
  const centerXL = modernPosts[3];
  const centerSmall = modernPosts.slice(4, 6);
  const rightLarge = modernPosts[6];
  const rightSmall = modernPosts.slice(7, 9);

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <a href="/" className="logo">
              Handicap International
            </a>
            <button 
              className="menu-toggle"
              role="button"
              tabIndex={0}
            >
              ☰
            </button>
          </div>
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
      <nav className="nav-categories">
        <div className="nav-list">
          <a href="/" className="nav-item active">Tout</a>
          {parentCategories.slice(0, 8).map(category => (
            <a 
              key={category._id} 
              href={`/${category.slug}`} 
              className="nav-item"
            >
              {category.name}
            </a>
          ))}
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

        {/* Load More Section */}
        {posts.length >= 12 && (
          <section style={{ textAlign: 'center', padding: '40px 0' }}>
            <a 
              href="/?page=2" 
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: '#333',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Voir plus d'articles
            </a>
          </section>
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