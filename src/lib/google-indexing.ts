import { google } from 'googleapis';


const APP_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const SCOPES = ['https://www.googleapis.com/auth/indexing'];

// Helper to fetch credentials from the API
async function fetchGoogleCredentials() {
  const apiUrl = `${APP_URL}/google-data`;
  console.log('[Google Indexing] Fetching credentials from:', apiUrl);
  
  const res = await fetch(apiUrl);
  if (!res.ok) {
    const errorText = await res.text();
    console.error('[Google Indexing] Failed to fetch credentials:', errorText);
    throw new Error('Failed to fetch Google credentials');
  }
  return res.json();
}

export async function notifyGoogleIndexing(url: string, type: 'URL_UPDATED' | 'URL_DELETED') {
  try {
    // Fetch credentials from the API (no auth required)
    const creds = await fetchGoogleCredentials();
    
    // Fix private_key newlines if needed
    const fixedKey = creds.private_key.replace(/\\n/g, '\n');
    
    const jwtClient = new google.auth.JWT({
      email: creds.client_email,
      key: fixedKey,
      scopes: SCOPES,
    });
    
    const indexing = google.indexing({
      version: 'v3',
      auth: jwtClient,
    });
    
    await jwtClient.authorize();
    
    console.log(`[Google Indexing] Submitting URL: ${url}, Type: ${type}`);
    const res = await indexing.urlNotifications.publish({
      requestBody: {
        url,
        type,
      },
    });
    
    console.log('[Google Indexing] Success:', res.data);
    return res.data;
  } catch (error) {
    console.error('Google Indexing API error:', error);
    throw error;
  }
}