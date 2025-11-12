# How to Deploy to Cloudflare Workers

## Prerequisites
1. A Cloudflare account (free tier available at https://dash.cloudflare.com/sign-up)
2. Your project built and ready

## Deployment Steps

### 1. Login to Cloudflare
Run this command in your terminal:
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
Deploy with:
```bash
npx wrangler deploy
```

That's it! Wrangler will:
- Bundle your application
- Upload it to Cloudflare Workers
- Provide you with a URL where your app is live (something like `interview-assistant.YOUR-SUBDOMAIN.workers.dev`)

## Configuration

The `wrangler.toml` file controls your deployment settings:
- `name`: Your worker's name
- `main`: Entry point file for Cloudflare Workers
- `compatibility_date`: Cloudflare API version
- `compatibility_flags`: Enables Node.js compatibility
- `[site]`: Serves your static assets (React frontend)

## Troubleshooting

If deployment fails:
1. Make sure you're logged in: `npx wrangler whoami`
2. Check the build completed successfully: `npm run build`
3. Review error messages from Wrangler for specific issues

## Custom Domain (Optional)

After deploying, you can add a custom domain in the Cloudflare dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Click "Settings" → "Triggers"
4. Add a custom domain
