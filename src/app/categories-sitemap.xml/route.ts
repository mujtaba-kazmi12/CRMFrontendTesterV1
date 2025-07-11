export async function GET(request: Request) {
  try {
    const backendUrl ='https://be.handicap-internatioanl.fr';
    const response = await fetch(`${backendUrl}/categories-sitemap.xml`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories sitemap');
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
    const categories = urlMatches.map(match => {
      const locMatch = match.match(/<loc>(.*?)<\/loc>/);
      const lastmodMatch = match.match(/<lastmod>(.*?)<\/lastmod>/);
      const priorityMatch = match.match(/<priority>(.*?)<\/priority>/);
      const changefreqMatch = match.match(/<changefreq>(.*?)<\/changefreq>/);
      
      return {
        loc: locMatch ? locMatch[1] : '',
        lastmod: lastmodMatch ? lastmodMatch[1] : '',
        priority: priorityMatch ? priorityMatch[1] : '0.5',
        changefreq: changefreqMatch ? changefreqMatch[1] : 'weekly'
      };
    });
    
    // Categorize into main categories and subcategories
    const mainCategories = categories.filter(cat => {
      const path = cat.loc.replace(/^https?:\/\/[^\/]+/, '');
      return path.split('/').filter(Boolean).length === 1;
    });
    
    const subCategories = categories.filter(cat => {
      const path = cat.loc.replace(/^https?:\/\/[^\/]+/, '');
      return path.split('/').filter(Boolean).length > 1;
    });
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Categories Sitemap</title>
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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border: 1px solid #10b981;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }
        
        .stat-card h3 {
            color: #065f46;
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .stat-card p {
            color: #047857;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 0.5px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #10b981;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .table-container {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            border: 1px solid #e5e7eb;
            margin-bottom: 30px;
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
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
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
        
        .category-link {
            color: #059669;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.95rem;
            display: block;
            transition: all 0.2s ease;
            word-break: break-all;
        }
        
        .category-link:hover {
            color: #047857;
            text-decoration: underline;
        }
        
        .category-info {
            font-size: 0.8rem;
            color: #6b7280;
            margin-top: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .category-slug {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.75rem;
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
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
            border: 1px solid #10b981;
        }
        
        .priority-low {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            color: #374151;
            border: 1px solid #9ca3af;
        }
        
        .changefreq {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: capitalize;
        }
        
        .freq-daily {
            background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
            color: #991b1b;
            border: 1px solid #ef4444;
        }
        
        .freq-weekly {
            background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
            color: #9a3412;
            border: 1px solid #f97316;
        }
        
        .freq-monthly {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
            border: 1px solid #10b981;
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
        
        .category-type {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .type-main {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            color: #1e40af;
            border: 1px solid #3b82f6;
        }
        
        .type-sub {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #92400e;
            border: 1px solid #f59e0b;
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
            color: #059669;
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
            
            .category-link {
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
            <h1>📁 Categories Sitemap</h1>
            <p>This sitemap contains all categories and subcategories with their hierarchical structure, priorities, and update frequencies for optimal SEO.</p>
        </div>
        
        <div class="content">
            <div class="stats">
                <div class="stat-card">
                    <h3>${categories.length}</h3>
                    <p>Total Categories</p>
                </div>
                <div class="stat-card">
                    <h3>${mainCategories.length}</h3>
                    <p>Main Categories</p>
                </div>
                <div class="stat-card">
                    <h3>${subCategories.length}</h3>
                    <p>Subcategories</p>
                </div>
                <div class="stat-card">
                    <h3>${categories.filter(cat => parseFloat(cat.priority) >= 0.8).length}</h3>
                    <p>High Priority</p>
                </div>
            </div>
            
            ${mainCategories.length > 0 ? `
            <div class="section">
                <h2 class="section-title">
                    🏷️ Main Categories
                </h2>
                <div class="table-container">
                    <table>
                        <thead class="table-header">
                            <tr>
                                <th style="width: 40%;">Category URL</th>
                                <th style="width: 15%;">Type</th>
                                <th style="width: 15%;">Priority</th>
                                <th style="width: 15%;">Update Freq</th>
                                <th style="width: 15%;">Last Modified</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${mainCategories.map((category, index) => {
                              const priority = parseFloat(category.priority);
                              let priorityClass = 'priority-low';
                              if (priority >= 0.8) priorityClass = 'priority-high';
                              else if (priority >= 0.6) priorityClass = 'priority-medium';
                              
                              let freqClass = 'freq-monthly';
                              if (category.changefreq === 'daily') freqClass = 'freq-daily';
                              else if (category.changefreq === 'weekly') freqClass = 'freq-weekly';
                              
                              const date = new Date(category.lastmod).toLocaleString();
                              const path = category.loc.replace(/^https?:\/\/[^\/]+/, '');
                              const slug = path.replace('/', '');
                              
                              return `
                                <tr>
                                    <td>
                                        <a href="${category.loc}" class="category-link" target="_blank">
                                            ${category.loc}
                                        </a>
                                        <div class="category-info">
                                            <span class="category-slug">${slug}</span>
                                            <span>#${index + 1}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="category-type type-main">Main</span>
                                    </td>
                                    <td>
                                        <span class="priority ${priorityClass}">${category.priority}</span>
                                    </td>
                                    <td>
                                        <span class="changefreq ${freqClass}">${category.changefreq}</span>
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
            ` : ''}
            
            ${subCategories.length > 0 ? `
            <div class="section">
                <h2 class="section-title">
                    📂 Subcategories
                </h2>
                <div class="table-container">
                    <table>
                        <thead class="table-header">
                            <tr>
                                <th style="width: 40%;">Subcategory URL</th>
                                <th style="width: 15%;">Type</th>
                                <th style="width: 15%;">Priority</th>
                                <th style="width: 15%;">Update Freq</th>
                                <th style="width: 15%;">Last Modified</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${subCategories.map((category, index) => {
                              const priority = parseFloat(category.priority);
                              let priorityClass = 'priority-low';
                              if (priority >= 0.8) priorityClass = 'priority-high';
                              else if (priority >= 0.6) priorityClass = 'priority-medium';
                              
                              let freqClass = 'freq-monthly';
                              if (category.changefreq === 'daily') freqClass = 'freq-daily';
                              else if (category.changefreq === 'weekly') freqClass = 'freq-weekly';
                              
                              const date = new Date(category.lastmod).toLocaleString();
                              const path = category.loc.replace(/^https?:\/\/[^\/]+/, '');
                              const pathParts = path.split('/').filter(Boolean);
                              const parentSlug = pathParts[0] || '';
                              const childSlug = pathParts[1] || '';
                              
                              return `
                                <tr>
                                    <td>
                                        <a href="${category.loc}" class="category-link" target="_blank">
                                            ${category.loc}
                                        </a>
                                        <div class="category-info">
                                            <span class="category-slug">${parentSlug}/${childSlug}</span>
                                            <span>#${index + 1}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="category-type type-sub">Sub</span>
                                    </td>
                                    <td>
                                        <span class="priority ${priorityClass}">${category.priority}</span>
                                    </td>
                                    <td>
                                        <span class="changefreq ${freqClass}">${category.changefreq}</span>
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
            ` : ''}
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
    console.error('Error fetching categories sitemap:', error);
    return new Response('Error generating categories sitemap', { status: 500 });
  }
} 