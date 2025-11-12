import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the dist folder (production build)
app.use(express.static(join(__dirname, 'dist')));

// API Routes
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const apiKey = process.env.BRAVE_SEARCH_API_KEY;
    
    if (!apiKey) {
      console.error('BRAVE_SEARCH_API_KEY not found in environment');
      return res.status(500).json({ error: 'Search API not configured' });
    }

    const braveUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=3`;
    
    const response = await fetch(braveUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey
      }
    });

    if (!response.ok) {
      console.error(`Brave API error: ${response.status}`);
      throw new Error(`Search failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.web?.results && data.web.results.length > 0) {
      const topResults = data.web.results.slice(0, 3);
      const formattedResults = topResults
        .map((result, index) => {
          const title = result.title || 'No title';
          const description = result.description || 'No description';
          return `${index + 1}. ${title}\n   ${description}`;
        })
        .join('\n\n');
      
      return res.json({ 
        success: true, 
        data: formattedResults 
      });
    }
    
    return res.json({ 
      success: false, 
      error: `No search results found for "${q}"` 
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Web search temporarily unavailable' 
    });
  }
});

// Serve the React app for all non-API routes (must be last)
app.use((req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Serving frontend from: ${join(__dirname, 'dist')}`);
});
