// @ts-ignore - cloudflare:node is available in Workers runtime
import { httpServerHandler } from 'cloudflare:node';
import { createServer } from 'node:http';

// Simple HTTP server without Express or body-parser
const server = createServer((req, res) => {
  const start = Date.now();
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  
  // Log on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${url.pathname} ${res.statusCode} ${duration}ms`);
  });

  // Health check endpoint
  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString() 
    }));
    return;
  }

  // Root endpoint
  if (url.pathname === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Interview Assistant - Cloudflare Workers</h1><p>Server is running!</p>');
    return;
  }

  // Handle POST/PUT/PATCH with JSON body
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      if (req.headers['content-type']?.includes('application/json')) {
        try {
          const data = JSON.parse(body);
          // You can add your API routes here
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Request received', data }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Invalid JSON' }));
        }
      } else {
        res.writeHead(415, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Unsupported Media Type' }));
      }
    });
    
    return;
  }

  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Not Found', path: url.pathname }));
});

server.listen(3000);

// Export using httpServerHandler for Cloudflare Workers
export default httpServerHandler({ port: 3000 });
