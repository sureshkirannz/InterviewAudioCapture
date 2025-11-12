// @ts-ignore - cloudflare:node is available in Workers runtime
import { httpServerHandler } from 'cloudflare:node';
import express, { type Request, Response, NextFunction } from "express";

const app = express();

// Custom body parser that doesn't use body-parser package
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    let data = '';
    
    req.on('data', (chunk) => {
      data += chunk.toString();
    });
    
    req.on('end', () => {
      if (data && req.headers['content-type']?.includes('application/json')) {
        try {
          req.body = JSON.parse(data);
        } catch (e) {
          req.body = {};
        }
      } else {
        req.body = data || {};
      }
      next();
    });
  } else {
    next();
  }
});

// Simple logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Routes
app.get("/", (_req: Request, res: Response) => {
  res.send("Interview Assistant - Cloudflare Workers");
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export default httpServerHandler(app);
