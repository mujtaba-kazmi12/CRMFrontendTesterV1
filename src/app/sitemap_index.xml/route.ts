export async function GET(request: Request) {
  try {
    const backendUrl ="https://be.handicap-internatioanl.fr";
    const response = await fetch(`${backendUrl}/sitemap_index.xml`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch sitemap index');
    }
    
    const xml = await response.text();
    
    // Check if request wants raw XML (for search engines)
    const url = new URL(request.url);
    const format = url.searchParams.get('format');
    
    if (format === 'xml') {
      return new Response(xml, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    
    // Parse XML and create styled HTML
    const sitemapMatches = xml.match(/<sitemap>(.*?)<\/sitemap>/gs) || [];
    const sitemaps = sitemapMatches.map(match => {
      const locMatch = match.match(/<loc>(.*?)<\/loc>/);
      const lastmodMatch = match.match(/<lastmod>(.*?)<\/lastmod>/);
      
      return {
        loc: locMatch ? locMatch[1] : '',
        lastmod: lastmodMatch ? lastmodMatch[1] : ''
      };
    });
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XML Sitemap Index</title>
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
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
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
        
        .info-box {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 1px solid #0ea5e9;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .info-box p {
            color: #0c4a6e;
            font-weight: 500;
            margin-bottom: 10px;
        }
        
        .info-box .count {
            font-size: 1.5rem;
            font-weight: 700;
            color: #0369a1;
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
            padding: 20px;
            text-align: left;
            font-weight: 600;
            font-size: 0.95rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        tbody tr {
            border-bottom: 1px solid #f3f4f6;
            transition: all 0.2s ease;
        }
        
        tbody tr:hover {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        tbody tr:last-child {
            border-bottom: none;
        }
        
        td {
            padding: 20px;
            vertical-align: middle;
        }
        
        .sitemap-link {
            color: #4f46e5;
            text-decoration: none;
            font-weight: 600;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
        }
        
        .sitemap-link:hover {
            color: #7c3aed;
            text-decoration: underline;
        }
        
        .sitemap-link::before {
            content: "🗺️";
            font-size: 1.2rem;
        }
        
        .lastmod {
            color: #6b7280;
            font-size: 0.95rem;
            font-family: 'Monaco', 'Menlo', monospace;
            background: #f9fafb;
            padding: 6px 12px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        
        .sitemap-type {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .type-posts {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #92400e;
            border: 1px solid #f59e0b;
        }
        
        .type-pages {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            color: #1e40af;
            border: 1px solid #3b82f6;
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
            color: #4f46e5;
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
                padding: 15px 10px;
                font-size: 0.9rem;
            }
            
            .sitemap-link {
                font-size: 0.9rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>XML Sitemap Index</h1>
            <p>This sitemap index contains ${sitemaps.length} sitemaps that help search engines discover and index your website content efficiently.</p>
        </div>
        
        <div class="content">
            <div class="info-box">
                <p>This sitemap index contains <span class="count">${sitemaps.length}</span> individual sitemaps.</p>
                <p>Search engines use this to discover all your content systematically.</p>
            </div>
            
            <div class="table-container">
                <table>
                    <thead class="table-header">
                        <tr>
                            <th>Sitemap</th>
                            <th>Type</th>
                            <th>Last Modified</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sitemaps.map(sitemap => {
                          const filename = sitemap.loc.split('/').pop() || '';
                          const type = filename.includes('post') ? 'posts' : 'pages';
                          const typeClass = filename.includes('post') ? 'type-posts' : 'type-pages';
                          const date = new Date(sitemap.lastmod).toLocaleString();
                          
                          return `
                            <tr>
                                <td>
                                    <a href="${sitemap.loc}" class="sitemap-link" target="_blank">
                                        ${filename}
                                    </a>
                                </td>
                                <td>
                                    <span class="sitemap-type ${typeClass}">${type}</span>
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
                <a href="/sitemap">View Frontend Sitemap</a>
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
    console.error('Error fetching sitemap index:', error);
    return new Response('Error generating sitemap index', { status: 500 });
  }
} 