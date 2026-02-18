# Proxy and CORS Explanation

## Why We Use a Proxy

### The Problem: CORS (Cross-Origin Resource Sharing)

When the frontend runs on `localhost:5173` and tries to call an API on `https://api-tallam.vocus-dev2.com`, the browser enforces CORS policies. The backend must explicitly allow requests from `localhost:5173` by setting CORS headers.

### The Solution: Vite Development Proxy

Instead of asking the backend to whitelist every development origin, we use Vite's proxy feature:

1. **Frontend makes request to**: `http://localhost:5173/api/front/...`
2. **Vite proxy intercepts** `/api/*` requests
3. **Proxy forwards to**: `https://api-tallam.vocus-dev2.com/api/front/...`
4. **Browser sees**: Same-origin request (no CORS check needed!)

### Benefits

- ✅ No backend CORS configuration needed for development
- ✅ Works with `withCredentials: true` (cookies)
- ✅ No CORS errors in development
- ✅ Backend doesn't need to know about frontend origins

## Configuration

### Development (Default - Uses Proxy)

```typescript
// In src/api/config.ts
baseURL: '/api/front'  // Uses Vite proxy
```

**Vite config** (`vite.config.ts`):
```typescript
proxy: {
    '/api': {
        target: 'https://api-tallam.vocus-dev2.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
            if (path.startsWith('/api/front')) {
                return path; // Already has /front
            }
            return path.replace(/^\/api/, '/api/front');
        }
    }
}
```

### Production

Set `VITE_API_BASE_URL` environment variable in Vercel:
```
VITE_API_BASE_URL=https://api-tallam.vocus-dev2.com/api/front
```

## Common Issues

### ❌ CORS Error: "Access-Control-Allow-Origin"

**Problem**: You set `VITE_API_BASE_URL=http://localhost:8000` in development

**Why**: This bypasses the Vite proxy. The browser tries to call `localhost:8000` directly, which triggers CORS.

**Solution**: 
- Remove `VITE_API_BASE_URL` from `.env` in development, OR
- Set it to `/api/front` to use the proxy

### ✅ Correct Development Setup

**Option 1**: Don't set `VITE_API_BASE_URL` (uses proxy automatically)
```bash
# .env (development)
# Leave VITE_API_BASE_URL unset or commented out
```

**Option 2**: Explicitly use proxy
```bash
# .env (development)
VITE_API_BASE_URL=/api/front
```

### ✅ Correct Production Setup

```bash
# Vercel Environment Variables
VITE_API_BASE_URL=https://api-tallam.vocus-dev2.com/api/front
```

## Vercel 404 Issue (Fixed)

### The Problem

When you copy a link like `https://your-app.vercel.app/en/dashboard` and open it in a new tab, Vercel returns a 404 because it doesn't know about that route (it's handled by React Router on the client).

### The Solution

Created `vercel.json` with a rewrite rule:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This tells Vercel: "For any route, serve `index.html` and let React Router handle the routing."

## Summary

| Environment | Base URL | Proxy Used? | CORS? |
|------------|----------|-------------|-------|
| Development (default) | `/api/front` | ✅ Yes | ❌ No |
| Development (with VITE_API_BASE_URL=localhost) | `http://localhost:8000` | ❌ No | ✅ Yes (error!) |
| Production | `https://api-tallam.vocus-dev2.com/api/front` | ❌ No | ✅ Yes (backend handles) |

**Best Practice**: 
- Development: Use the proxy (don't set `VITE_API_BASE_URL` or set it to `/api/front`)
- Production: Set `VITE_API_BASE_URL` to the full backend URL



