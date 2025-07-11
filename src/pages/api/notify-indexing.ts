import type { NextApiRequest, NextApiResponse } from 'next';
import { notifyGoogleIndexing } from '../../lib/google-indexing';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[GOOGLE INDEXING] Incoming request:', req.body);
  const { url, type } = req.body;
  
  if (!url || !type) {
    return res.status(400).json({ 
      success: false,
      error: 'Missing required fields: url and type are required' 
    });
  }

  console.log(`[GOOGLE INDEXING] Type: ${type}, URL: ${url}`);

  try {
    const result = await notifyGoogleIndexing(url, type);
    console.log(`[GOOGLE INDEXING] Success: ${type} for ${url}`, result);
    return res.status(200).json({ 
      success: true, 
      message: 'URL submitted for indexing',
      result 
    });
  } catch (error: any) {
    console.error('[GOOGLE INDEXING] Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to submit URL for indexing',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}