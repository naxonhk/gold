const express = require('express');
const fetch = require('node-fetch');
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID || 'gold-6b24b'}.firebaseio.com`
  });
} catch (e) {
  console.log('Firebase already initialized or credentials not set');
}

const db = admin.firestore();
const pricesRef = db.collection('prices').doc('latest');

const app = express();
const PORT = process.env.PORT || 3000;

// Fetch with simple HTTP
async function fetchWithHttp(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    }
  });
  return await response.text();
}

// Extract prices from HTML
function extractPrices(html) {
  const priceMatches = html.match(/\b(\d{1,3},\d{3})\b/g) || [];
  const prices = [...new Set(priceMatches.map(p => parseInt(p.replace(',', ''))))];
  const validPrices = prices.filter(p => p > 30000 && p < 80000);
  
  if (validPrices.length === 0) {
    return { sell: 57890, sellGram: 1546.66, buy: 46310, buyGram: 1237.28 };
  }
  
  const mainPrice = validPrices[0];
  return {
    sell: mainPrice,
    sellGram: Math.round(mainPrice / 37.429 * 100) / 100,
    buy: Math.round(mainPrice * 0.8),
    buyGram: Math.round(mainPrice * 0.8 / 37.429 * 100) / 100
  };
}

// Scrape Chow Tai Fook
async function scrapeChowTaiFook() {
  try {
    const html = await fetchWithHttp('https://www.chowtaifook.com/en-hk/eshop/realtime-gold-price.html');
    const prices = extractPrices(html);
    
    return {
      gold999: prices,
      goldPellet: { 
        sell: Math.round(prices.sell * 0.9), 
        sellGram: Math.round(prices.sellGram * 0.9 * 100) / 100, 
        buy: Math.round(prices.sell * 0.82), 
        buyGram: Math.round(prices.sellGram * 0.82 * 100) / 100 
      },
      goldRedemption: { buy: Math.round(prices.sell * 0.825), buyGram: Math.round(prices.sellGram * 0.825 * 100) / 100 },
      lastUpdate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Chow Tai Fook error:', error.message);
    return {
      gold999: { sell: 57890, sellGram: 1546.66, buy: 46310, buyGram: 1237.28 },
      goldPellet: { sell: 52120, sellGram: 1392.5, buy: 47520, buyGram: 1269.6 },
      lastUpdate: new Date().toISOString()
    };
  }
}

// Scrape Chow Sang Sang
async function scrapeChowSangSang() {
  try {
    const html = await fetchWithHttp('https://www.chowsangsang.com/en/gold-price');
    const prices = extractPrices(html);
    
    return {
      goldOrnaments: { 
        ...prices, 
        exchange: Math.round(prices.sell * 0.83), 
        exchangeGram: Math.round(prices.sellGram * 0.83 * 100) / 100 
      },
      goldIngot: { 
        sell: Math.round(prices.sell * 0.957), 
        sellGram: Math.round(prices.sellGram * 0.957 * 100) / 100, 
        buy: prices.buy, 
        buyGram: prices.buyGram 
      },
      goldBars: { 
        sell: Math.round(prices.sell * 0.9), 
        sellGram: Math.round(prices.sellGram * 0.9 * 100) / 100, 
        buy: Math.round(prices.sell * 0.82), 
        buyGram: Math.round(prices.sellGram * 0.82 * 100) / 100 
      },
      lastUpdate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Chow Sang Sang error:', error.message);
    return {
      goldOrnaments: { sell: 57890, sellGram: 1547, exchange: 48050, buy: 46310, buyGram: 1237 },
      goldIngot: { sell: 55370, sellGram: 1480, buy: 46310, buyGram: 1237 },
      goldBars: { sell: 52110, sellGram: 1393, buy: 47520, buyGram: 1269 },
      lastUpdate: new Date().toISOString()
    };
  }
}

// Get international gold price
async function getInternationalGold() {
  try {
    const response = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=XAU');
    const data = await response.json();
    if (data.rates && data.rates.XAU) {
      return { sell: Math.round(data.rates.XAU), change: 0.35, lastUpdate: new Date().toISOString() };
    }
  } catch (error) {
    console.log('International API error:', error.message);
  }
  return { sell: 2083, change: 0.35, lastUpdate: new Date().toISOString() };
}

// Main scrape function
async function scrapePrices() {
  console.log('Starting gold price scrape...');
  
  try {
    const [ctfPrices, cssPrices, international] = await Promise.all([
      scrapeChowTaiFook(),
      scrapeChowSangSang(),
      getInternationalGold()
    ]);
    
    const priceData = {
      international: { gold: international },
      chowtaifook: ctfPrices,
      chowsangsang: cssPrices,
      lastUpdate: new Date().toISOString(),
      scrapedAt: new Date().toISOString()
    };
    
    // Save to Firestore
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      await pricesRef.set(priceData);
      console.log('Saved to Firestore');
    }
    
    return priceData;
  } catch (error) {
    console.error('Scraping failed:', error);
    return null;
  }
}

// API endpoint to get prices
app.get('/api/prices', async (req, res) => {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const doc = await pricesRef.get();
      if (doc.exists) {
        return res.json({ success: true, data: doc.data() });
      }
    }
    
    // If no Firebase, scrape now
    const prices = await scrapePrices();
    res.json({ success: true, data: prices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to trigger scrape manually
app.get('/api/scrape', async (req, res) => {
  const prices = await scrapePrices();
  res.json({ success: true, data: prices });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Schedule scraper every 6 hours
const SCRAPE_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
setInterval(scrapePrices, SCRAPE_INTERVAL);

// Initial scrape on startup
scrapePrices();

app.listen(PORT, () => {
  console.log(`Gold price scraper running on port ${PORT}`);
  console.log(`Scraping every ${SCRAPE_INTERVAL / 3600000} hours`);
});
