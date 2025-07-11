import { NextApiRequest, NextApiResponse } from 'next';
import getConfig from 'next/config'
const { publicRuntimeConfig } = getConfig();
const WEBHOOK_SECRET = publicRuntimeConfig.WEBHOOK_SECRET;

const APP_URL = process.env.NEXT_PUBLIC_CRM_API_URL;



async function callIndexingApi(url: string, body: object) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API call to ${url} failed with status ${response.status}: ${errorBody}`);
  }

  return response.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const receivedSecret = req.headers['x-webhook-secret'];
  if (!WEBHOOK_SECRET || receivedSecret !== WEBHOOK_SECRET) {
    console.error('[WEBHOOK] Unauthorized: Invalid or missing secret.');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { post } = req.body;
  if (!post || !post.slug) {
    console.error('[WEBHOOK] Bad Request: Missing post.slug.');
    return res.status(400).json({ error: 'Invalid post data, slug is required' });
  }

  const postUrl = `https://handicap-internatioanl.fr/posts/${post.slug}`;
  console.log(`[WEBHOOK] Received new post, preparing to index URL: ${postUrl}`);

  try {
    // Fix: Remove extra /api from path, since APP_URL already ends with /api
    const googlePromise = callIndexingApi(`${APP_URL}/notify-indexing`, { url: postUrl, type: 'URL_UPDATED' });
    const bingPromise = callIndexingApi(`${APP_URL}/notify-bing-indexing`, { url: postUrl });

    const results = await Promise.allSettled([googlePromise, bingPromise]);

    const failedIndexes = results.filter(r => r.status === 'rejected');

    if (failedIndexes.length > 0) {
      console.error('[WEBHOOK] One or more indexing calls failed:');
      failedIndexes.forEach(failure => {
        console.error((failure as PromiseRejectedResult).reason);
      });
      // Acknowledge receipt but report failure
      return res.status(200).json({ 
        success: true, 
        message: 'Webhook processed, but some indexing calls failed.',
        details: failedIndexes.map(f => (f as PromiseRejectedResult).reason.message)
      });
    }

    console.log('[WEBHOOK] All indexing APIs called successfully.');
    res.status(200).json({ success: true, message: 'All indexing APIs called successfully.' });

  } catch (error) {
    console.error('[WEBHOOK] An unexpected error occurred:', error);
    res.status(500).json({ error: 'An unexpected error occurred during webhook processing.' });
  }
} 