export async function GET() {
  try {
    const backendUrl ='https://be.handicap-internatioanl.fr';
    const response = await fetch(`${backendUrl}/sitemap.xml`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch sitemap');
    }
    
    const xml = await response.text();
    
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
} 