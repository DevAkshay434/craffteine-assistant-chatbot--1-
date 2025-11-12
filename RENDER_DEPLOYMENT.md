# Deploying Craffteine Assistant to Render

## Quick Setup

### 1. Build the Frontend
```bash
npm run build
```
This creates the `dist` folder with your production-ready React app.

### 2. Configure Render

**Service Type:** Web Service

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Environment Variables:**
Add these in Render's Environment settings:
- `BRAVE_SEARCH_API_KEY` - Your Brave Search API key (for news/web search)
- `PORT` - Render will set this automatically

### 3. How It Works

The production setup runs a single Express server that:
1. Serves the API at `/api/search` (for web search/news)
2. Serves the built React app for all other routes
3. Handles both frontend and backend on one port

### 4. Testing Locally (Production Mode)

```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

Visit `http://localhost:3001` - everything should work including news search!

### 5. Development Mode (Replit)

```bash
# Terminal 1: Backend
npm run backend

# Terminal 2: Frontend
npm run dev
```

Visit port 5000 for development with hot reload.

## Troubleshooting

**News search not working?**
- Check if `BRAVE_SEARCH_API_KEY` is set in Render environment variables
- Check Render logs for "BRAVE_SEARCH_API_KEY not found" errors

**App not loading?**
- Make sure `npm run build` completed successfully
- Check that the `dist` folder exists and contains built files
- Check Render logs for startup errors

**API calls failing?**
- The API runs on the same domain/port as the frontend in production
- No CORS issues since everything is on one server
