// @ts-ignore - cloudflare:node is available in Workers runtime
import { httpServerHandler } from 'cloudflare:node';
import express, { type Request, Response, NextFunction } from "express";

const app = express();

// Simple text body parser that's Workers-compatible
app.use(express.text({ type: 'application/json' }));

// Parse JSON manually to avoid body-parser issues
app.use((req, res, next) => {
  if (req.is('application/json') && typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      // Keep as string if not valid JSON
    }
  }
  next();
});

// Simple logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Routes
app.get("/", (_req, res) => {
  res.send("Interview Assistant - Cloudflare Workers");
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export default httpServerHandler(app);
