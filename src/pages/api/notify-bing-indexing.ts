import type { NextApiRequest, NextApiResponse } from 'next';
import { notifyBingIndexing } from '../../lib/bing-indexing';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  console.log('[BING INDEXING] Incoming request:', req.body);
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ 
      success: false,
      error: 'Missing required field: url' 
    });
  }

  console.log(`[BING INDEXING] Processing URL: ${url}`);

  try {
    const result = await notifyBingIndexing(url);
    console.log(`[BING INDEXING] Success for ${url}`, result);
    
    return res.status(200).json({ 
      success: true, 
      message: 'URL submitted to Bing for indexing',
      result 
    });
  } catch (error: any) {
    console.error('[BING INDEXING] Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to submit URL to Bing',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}