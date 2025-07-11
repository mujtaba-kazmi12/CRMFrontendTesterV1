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

function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function formatAMPContent(content: string): string {
  // Replace images with amp-img tags
  let ampContent = content.replace(
    /<img([^>]*?)src=["']([^"']*?)["']([^>]*?)>/gi,
    (match, beforeSrc, src, afterSrc) => {
      const cleanSrc = src.startsWith('http') ? src : `${imageBaseUrl}${src.startsWith('/') ? '' : '/'}${src}`;
      const widthMatch = match.match(/width=["']?(\d+)["']?/i);
      const heightMatch = match.match(/height=["']?(\d+)["']?/i);
      const altMatch = match.match(/alt=["']([^"']*)["']?/i);
      
      const width = widthMatch ? widthMatch[1] : '800';
      const height = heightMatch ? heightMatch[1] : '400';
      const alt = altMatch ? altMatch[1] : '';
      
      return `<amp-img src="${cleanSrc}" alt="${alt}" width="${width}" height="${height}" layout="responsive"></amp-img>`;
    }
  );
  
  // Remove any remaining non-AMP elements
  ampContent = ampContent.replace(/<script[^>]*>.*?<\/script>/gi, '');
  ampContent = ampContent.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
  
  return ampContent;
}

interface PostAMPProps {
  post: Post;
  categories: Category[];
}

export default function PostAMP({ post, categories }: PostAMPProps) {
  const parentCategories = categories.filter(category => !category.parentId);
  const postImage = getPostImage(post);
  const ampContent = formatAMPContent(post.content);

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <a href="/amp" className="logo">
              Handicap International
            </a>
            <button 
              className="menu-toggle"
              {...({ on: "tap:sidebar.toggle" } as any)}
              role="button"
              tabIndex={0}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <amp-sidebar id="sidebar" layout="nodisplay" side="left">
        <div className="sidebar-header">
          <span className="logo">Menu</span>
          <button 
            className="sidebar-close"
            {...({ on: "tap:sidebar.close" } as any)}
            role="button"
            tabIndex={0}
          >
            ✕
          </button>
        </div>
        <nav>
          <ul className="sidebar-nav">
            <li><a href="/amp">Accueil</a></li>
            {parentCategories.map(category => (
              <li key={category._id}>
                <a href={`/amp/${category.slug}`}>{category.name}</a>
              </li>
            ))}
          </ul>
        </nav>
      </amp-sidebar>

      {/* Breadcrumb */}
      <nav style={{ 
        background: '#f8f9fa', 
        padding: '8px 0',
        fontSize: '14px',
        borderBottom: '1px solid #e5e5e5'
      }}>
        <div className="container">
          <a href="/amp" style={{ color: '#666', textDecoration: 'none' }}>Accueil</a>
          <span style={{ margin: '0 8px', color: '#999' }}>›</span>
          <span style={{ color: '#333' }}>Article</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container">
        <article style={{ 
          maxWidth: '800px', 
          margin: '0 auto', 
          padding: '20px 0' 
        }}>
          {/* Article Header */}
          <header style={{ marginBottom: '30px' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              lineHeight: '1.3',
              margin: '0 0 16px 0',
              color: '#333'
            }}>
              {post.title}
            </h1>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '20px',
              fontSize: '14px',
              color: '#666'
            }}>
              <span>
                {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
              <span style={{ margin: '0 12px' }}>•</span>
              <span>Lecture: 3 min</span>
            </div>

            {/* Excerpt */}
            {post.excerpt && (
              <p style={{
                fontSize: '18px',
                lineHeight: '1.6',
                color: '#666',
                fontStyle: 'italic',
                margin: '0 0 20px 0',
                padding: '16px',
                background: '#f8f9fa',
                borderLeft: '4px solid #333',
                borderRadius: '4px'
              }}>
                {post.excerpt}
              </p>
            )}

            {/* Featured Image */}
            {postImage && (
              <figure style={{ margin: '0 0 30px 0' }}>
                <amp-img
                  src={postImage}
                  alt={post.title}
                  width="800"
                  height="400"
                  layout="responsive"
                  style={{ borderRadius: '8px' }}
                />
              </figure>
            )}
          </header>

          {/* Article Content */}
          <div 
            style={{
              fontSize: '16px',
              lineHeight: '1.7',
              color: '#333'
            }}
            dangerouslySetInnerHTML={{ __html: ampContent }}
          />

          {/* Article Footer */}
          <footer style={{ 
            marginTop: '40px', 
            paddingTop: '20px',
            borderTop: '1px solid #e5e5e5'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ 
                fontSize: '14px', 
                color: '#666',
                margin: '0 0 12px 0'
              }}>
                Catégories:
              </p>
              {/* Categories would be displayed here if available */}
            </div>

            {/* Share Section */}
            <div style={{ 
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ 
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#333'
              }}>
                Partager cet article
              </p>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://handicap-internatioanl.fr/posts/${post.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    background: '#1877f2',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  Facebook
                </a>
                <a 
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://handicap-internatioanl.fr/posts/${post.slug}`)}&text=${encodeURIComponent(post.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    background: '#1da1f2',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  Twitter
                </a>
                <a 
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://handicap-internatioanl.fr/posts/${post.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    background: '#0077b5',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </footer>
        </article>

        {/* Navigation */}
        <nav style={{ 
          marginTop: '40px',
          textAlign: 'center'
        }}>
          <a 
            href="/amp"
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
            ← Retour aux articles
          </a>
        </nav>
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
            Version mobile optimisée AMP.
          </p>
          <div style={{ marginTop: '16px' }}>
            <a 
              href={`/posts/${post.slug}`}
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