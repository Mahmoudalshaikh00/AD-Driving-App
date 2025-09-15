import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../backend/hono';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('🚀 API Handler called:', {
      method: req.method,
      url: req.url,
      headers: Object.keys(req.headers),
      hasBody: !!req.body
    });

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

    // Handle body properly for different content types
    let body: string | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const contentType = req.headers['content-type'];
      if (contentType?.includes('application/json')) {
        body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      } else {
        body = req.body ? String(req.body) : undefined;
      }
    }

    const request = new Request(url, {
      method: req.method || 'GET',
      headers,
      body,
    });

    console.log('📤 Forwarding request to Hono app:', {
      url,
      method: req.method,
      contentType: headers.get('content-type'),
      bodyLength: body?.length || 0
    });

    const response = await app.fetch(request);
    
    console.log('📥 Hono response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    // Set status
    res.status(response.status);
    
    // Set headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // Send body
    const responseBody = await response.text();
    console.log('📤 Sending response:', {
      status: response.status,
      bodyLength: responseBody.length,
      bodyPreview: responseBody.substring(0, 200)
    });
    
    res.send(responseBody);
  } catch (error) {
    console.error('🚨 API Handler Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}