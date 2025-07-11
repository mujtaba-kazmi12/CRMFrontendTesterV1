export async function GET(request: Request) {
  try {
    const backendUrl ='https://be.handicap-internatioanl.fr';
    const response = await fetch(`${backendUrl}/post-sitemap.xml`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch posts sitemap');
    }
    
    const xml = await response.text();
    
    // Check if request wants raw XML (for search engines)
    const url = new URL(request.url);
    const format = url.searchParams.get('format');
    const userAgent = request.headers.get('user-agent') || '';
    
    // Detect search engine crawlers (case-insensitive)
    const isSearchEngine = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|developers\.google\.com|google-structured-data-testing-tool|google\.com\/bot|crawl|spider|bot/i.test(userAgent);
    
    // Additional check for empty or missing user agent (some bots)
    const isLikelyBot = !userAgent || userAgent.length < 10;
    
    // Serve XML for search engines by default, or when explicitly requested
    if (format === 'xml' || isSearchEngine || isLikelyBot) {
      return new Response(xml, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    
    // Parse XML and create styled HTML
    const urlMatches = xml.match(/<url>(.*?)<\/url>/gs) || [];
    const posts = urlMatches.map(match => {
      const locMatch = match.match(/<loc>(.*?)<\/loc>/);
      const lastmodMatch = match.match(/<lastmod>(.*?)<\/lastmod>/);
      const priorityMatch = match.match(/<priority>(.*?)<\/priority>/);
      const imageMatches = match.match(/<image:image>(.*?)<\/image:image>/gs) || [];
      
      return {
        loc: locMatch ? locMatch[1] : '',
        lastmod: lastmodMatch ? lastmodMatch[1] : '',
        priority: '1.0',
        imageCount: imageMatches.length
      };
    });
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Posts Sitemap</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.6;
        }
        
        .content {
            padding: 40px;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 1px solid #f59e0b;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }
        
        .stat-card h3 {
            color: #92400e;
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .stat-card p {
            color: #78350f;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 0.5px;
        }
        
        .table-container {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            border: 1px solid #e5e7eb;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .table-header {
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            color: white;
        }
        
        .table-header th {
            padding: 20px 15px;
            text-align: left;
            font-weight: 600;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        tbody tr {
            border-bottom: 1px solid #f3f4f6;
            transition: all 0.2s ease;
        }
        
        tbody tr:hover {
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        tbody tr:last-child {
            border-bottom: none;
        }
        
        td {
            padding: 15px;
            vertical-align: middle;
        }
        
        .post-link {
            color: #d97706;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.95rem;
            display: block;
            transition: all 0.2s ease;
            word-break: break-all;
        }
        
        .post-link:hover {
            color: #92400e;
            text-decoration: underline;
        }
        
        .post-title {
            font-size: 0.85rem;
            color: #6b7280;
            margin-top: 4px;
        }
        
        .priority {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        
        .priority-high {
            background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            color: #166534;
            border: 1px solid #22c55e;
        }
        
        .priority-medium {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #92400e;
            border: 1px solid #f59e0b;
        }
        
        .priority-low {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            color: #374151;
            border: 1px solid #9ca3af;
        }
        
        .image-count {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            color: #1e40af;
            padding: 6px 10px;
            border-radius: 16px;
            font-size: 0.8rem;
            font-weight: 600;
            border: 1px solid #3b82f6;
        }
        
        .image-count::before {
            content: "🖼️";
        }
        
        .lastmod {
            color: #6b7280;
            font-size: 0.85rem;
            font-family: 'Monaco', 'Menlo', monospace;
            background: #f9fafb;
            padding: 6px 10px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        
        .footer {
            background: #f9fafb;
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer p {
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        .footer a {
            color: #d97706;
            text-decoration: none;
            font-weight: 600;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .content {
                padding: 20px;
            }
            
            .table-header th,
            td {
                padding: 10px 8px;
                font-size: 0.8rem;
            }
            
            .post-link {
                font-size: 0.85rem;
            }
            
            .stats {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 Posts Sitemap</h1>
            <p>This sitemap contains all published posts with their URLs, priorities, and image information for search engine optimization.</p>
        </div>
        
        <div class="content">
            <div class="stats">
                <div class="stat-card">
                    <h3>${posts.length}</h3>
                    <p>Total Posts</p>
                </div>
                <div class="stat-card">
                    <h3>${posts.reduce((sum, post) => sum + post.imageCount, 0)}</h3>
                    <p>Total Images</p>
                </div>
                <div class="stat-card">
                    <h3>${posts.filter(post => parseFloat(post.priority) >= 0.8).length}</h3>
                    <p>High Priority</p>
                </div>
                <div class="stat-card">
                    <h3>${posts.filter(post => post.imageCount > 0).length}</h3>
                    <p>With Images</p>
                </div>
            </div>
            
            <div class="table-container">
                <table>
                    <thead class="table-header">
                        <tr>
                            <th style="width: 40%;">Post URL</th>
                            <th style="width: 15%;">Priority</th>
                            <th style="width: 15%;">Images</th>
                            <th style="width: 30%;">Last Modified</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${posts.map((post, index) => {
                          const priority = parseFloat(post.priority);
                          let priorityClass = 'priority-low';
                          if (priority >= 0.8) priorityClass = 'priority-high';
                          else if (priority >= 0.6) priorityClass = 'priority-medium';
                          
                          const date = new Date(post.lastmod).toLocaleString();
                          const slug = post.loc.split('/').pop() || '';
                          
                          return `
                            <tr>
                                <td>
                                    <a href="${post.loc}" class="post-link" target="_blank">
                                        ${post.loc}
                                    </a>
                                    <div class="post-title">#${index + 1} • ${slug}</div>
                                </td>
                                <td>
                                    <span class="priority ${priorityClass}">${post.priority}</span>
                                </td>
                                <td>
                                    ${post.imageCount > 0 ? `<span class="image-count">${post.imageCount}</span>` : '<span style="color: #9ca3af;">No images</span>'}
                                </td>
                                <td>
                                    <span class="lastmod">${date}</span>
                                </td>
                            </tr>
                          `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="footer">
            <p>
                Generated automatically • 
                <a href="?format=xml">View Raw XML</a> • 
                <a href="/sitemap_index.xml">Back to Sitemap Index</a>
            </p>
        </div>
    </div>
</body>
</html>`;
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching posts sitemap:', error);
    return new Response('Error generating posts sitemap', { status: 500 });
  }
} 