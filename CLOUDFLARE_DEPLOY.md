# How to Deploy to Cloudflare Workers

## Prerequisites
1. A Cloudflare account (free tier available at https://dash.cloudflare.com/sign-up)
2. Your project built and ready

## Deployment Steps

### 1. Login to Cloudflare (Optional for GUI deployment)
If deploying via CLI, run this command in your terminal:
```bash
npx wrangler login
```
This will open a browser window where you can authorize Wrangler to access your Cloudflare account.

### 2. Build Your Project
Make sure your project is built:
```bash
npm run build
```

### 3. Deploy to Cloudflare Workers

**Option A: Using Cloudflare GUI (Recommended for first deployment)**
1. Go to your Cloudflare dashboard
2. Navigate to Workers & Pages
3. Click "Create Application" → "Workers" → "Connect to Git"
4. Connect your repository and use these settings:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Root directory: `/`

**Option B: Using CLI**
Deploy with:
```bash
npx wrangler deploy
```

That's it! Wrangler will:
- Bundle your application using native Node.js HTTP server (no Express dependencies)
- Upload it to Cloudflare Workers
- Provide you with a URL where your app is live (something like `interview-assistant.YOUR-SUBDOMAIN.workers.dev`)

## Architecture

This project uses TWO separate entry points:

- **`server/index.ts`**: For Replit development environment (uses Express with full Node.js)
- **`server/cloudflare.ts`**: For Cloudflare Workers deployment (uses native `node:http` without Express)

This separation ensures compatibility with both environments without conflicts.

## Configuration

The `wrangler.toml` file controls your deployment settings:
- `name`: Your worker's name  
- `main`: Entry point file (`server/cloudflare.ts`)
- `compatibility_date`: `2025-11-12` (required for Node.js HTTP support)
- `compatibility_flags`: `["nodejs_compat"]` (enables Node.js APIs)
- `[site]`: Serves your static assets (React frontend from `dist/public`)

## Troubleshooting

If deployment fails:
1. Make sure you're logged in: `npx wrangler whoami`
2. Check the build completed successfully: `npm run build`
3. Ensure `compatibility_date` is >= `2025-08-15` for Node.js HTTP support
4. Review error messages from Wrangler for specific issues
5. Check that the build output exists at `dist/public` for static assets

## Custom Domain (Optional)

After deploying, you can add a custom domain in the Cloudflare dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Click "Settings" → "Triggers"
4. Add a custom domain

## Testing Your Deployment

Once deployed, test these endpoints:
- **Root**: `https://your-worker.workers.dev/` - Should show a welcome message
- **Health Check**: `https://your-worker.workers.dev/api/health` - Should return JSON status

## Limits & Pricing

Cloudflare Workers free tier includes:
- 100,000 requests per day
- 10ms CPU time per request
- Automatic global deployment to 300+ locations

For production workloads, consider upgrading to the paid plan.
