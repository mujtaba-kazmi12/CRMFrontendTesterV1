// Bing Indexing Utility
import getConfig from 'next/config'


const APP_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Helper to fetch Bing credentials from the API
async function fetchBingCredentials() {
  const apiUrl = `${APP_URL}/bing-indexing`;
  console.log('[Bing Indexing] Fetching credentials from:', apiUrl);
  
  const res = await fetch(apiUrl);
  if (!res.ok) {
    const errorText = await res.text();
    console.error('[Bing Indexing] Failed to fetch credentials:', errorText);
    throw new Error('Failed to fetch Bing credentials');
  }
  return res.json();
}

export async function notifyBingIndexing(url: string) {
  try {
    console.log('[Bing Indexing] Fetching credentials...');
    // Fetch Bing API key and site URL from the API (no auth required)
    const creds = await fetchBingCredentials();
    
    if (!creds.bingApiKey || !creds.bingSiteUrl) {
      throw new Error('Missing required Bing credentials');
    }

    const { bingApiKey: apiKey, bingSiteUrl: siteUrl } = creds;
    const endpoint = `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${apiKey}`;
    
    const body = {
      siteUrl: siteUrl,
      urlList: [url],
    };

    console.log('[Bing Indexing] Submitting URL:', url);
    console.log('[Bing Indexing] Site URL:', siteUrl);
    console.log('[Bing Indexing] Endpoint:', endpoint);

    console.log('[Bing Indexing] Sending request...');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body),
    });

    const responseText = await res.text();
    console.log('[Bing Indexing] Response status:', res.status);
    console.log('[Bing Indexing] Response:', responseText);

    if (!res.ok) {
      throw new Error(`Bing API responded with status ${res.status}: ${responseText}`);
    }

    try {
      const json = JSON.parse(responseText);
      console.log('[Bing Indexing] Success:', json);
      return json;
    } catch (parseError) {
      console.error('[Bing Indexing] Failed to parse response:', parseError);
      throw new Error('Invalid JSON response from Bing API');
    }
  } catch (error) {
    console.error('[Bing Indexing] Error:', error);
    throw error;
  }
}