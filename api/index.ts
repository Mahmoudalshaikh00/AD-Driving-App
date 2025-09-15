import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../backend/hono';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Create a proper Request object from VercelRequest
  const url = `https://${req.headers.host}${req.url}`;
  const headers = new Headers();
  
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        headers.set(key, value.join(', '));
      } else {
        headers.set(key, String(value));
      }
    }
  });

  const request = new Request(url, {
    method: req.method || 'GET',
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  });

  try {
    const response = await app.fetch(request);
    
    // Set status
    res.status(response.status);
    
    // Set headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // Send body
    const body = await response.text();
    res.send(body);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}