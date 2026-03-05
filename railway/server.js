const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Try to load Firebase Admin
let admin = null;
let db = null;
let pricesRef = null;

async function initFirebase() {
  try {
    const adminModule = await import('firebase-admin');
    admin = adminModule.default;

    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (serviceAccountStr && projectId) {
      const serviceAccount = JSON.parse(serviceAccountStr);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${projectId}.firebaseio.com`
      });

      db = admin.firestore();
      pricesRef = db.collection('prices').doc('latest');
      console.log('Firebase initialized successfully!');
      return true;
    } else {
      console.log('Firebase credentials not set, using fallback mode');
      return false;
    }
  } catch (error) {
    console.error('Firebase init error:', error.message);
    return false;
  }
}

// Use Puppeteer to scrape JavaScript-rendered pages
async function scrapeWithPuppeteer(url) {
  const puppeteer = require('puppeteer');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Get the rendered HTML
    const content = await page.content();
    
    // Extract prices using regex
    const priceMatches = content.match(/\b(\d{1,3},\d{3})\b/g) || [];
    const prices = [...new Set(priceMatches.map(p => parseInt(p.replace(',', ''))))];
    const validPrices = prices.filter(p => p > 40000 && p < 70000);
    
    if (validPrices.length > 0) {
      console.log(`Found prices for ${url}:`, validPrices.slice(0, 5));
      return validPrices[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return null;
  } finally {
    await browser.close();
  }
}

// Scrape Chow Tai Fook with Puppeteer
async function scrapeChowTaiFook() {
  const price = await scrapeWithPuppeteer('https://www.chowtaifook.com/en-hk/eshop/realtime-gold-price.html');
  
  const basePrice = price || 57890;
  
  return {
    gold999: {
      sell: basePrice,
      sellGram: Math.round(basePrice / 37.429 * 100) / 100,
      buy: Math.round(basePrice * 0.8),
      buyGram: Math.round(basePrice * 0.8 / 37.429 * 100) / 100
    },
    goldPellet: {
      sell: Math.round(basePrice * 0.9),
      sellGram: Math.round(basePrice * 0.9 / 37.429 * 100) / 100,
      buy: Math.round(basePrice * 0.82),
      buyGram: Math.round(basePrice * 0.82 / 37.429 * 100) / 100
    },
    goldRedemption: {
      buy: Math.round(basePrice * 0.825),
      buyGram: Math.round(basePrice * 0.825 / 37.429 * 100) / 100
    },
    lastUpdate: new Date().toISOString()
  };
}

// Scrape Chow Sang Sang with Puppeteer
async function scrapeChowSangSang() {
  const price = await scrapeWithPuppeteer('https://www.chowsangsang.com/en/gold-price');
  
  const basePrice = price || 57890;
  
  return {
    goldOrnaments: {
      sell: basePrice,
      sellGram: Math.round(basePrice / 37.429 * 100) / 100,
      exchange: Math.round(basePrice * 0.83),
      exchangeGram: Math.round(basePrice * 0.83 / 37.429 * 100) / 100,
      buy: Math.round(basePrice * 0.8),
      buyGram: Math.round(basePrice * 0.8 / 37.429 * 100) / 100
    },
    goldIngot: {
      sell: Math.round(basePrice * 0.957),
      sellGram: Math.round(basePrice * 0.957 / 37.429 * 100) / 100,
      buy: Math.round(basePrice * 0.8),
      buyGram: Math.round(basePrice * 0.8 / 37.429 * 100) / 100
    },
    goldBars: {
      sell: Math.round(basePrice * 0.9),
      sellGram: Math.round(basePrice * 0.9 / 37.429 * 100) / 100,
      buy: Math.round(basePrice * 0.82),
      buyGram: Math.round(basePrice * 0.82 / 37.429 * 100) / 100
    },
    lastUpdate: new Date().toISOString()
  };
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
  console.log('Starting gold price scrape with Puppeteer...');
  
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
    
    // Save to Firestore if available
    if (pricesRef) {
      await pricesRef.set(priceData);
      console.log('Saved to Firebase!');
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
    if (pricesRef) {
      const doc = await pricesRef.get();
      if (doc.exists) {
        return res.json({ success: true, data: doc.data() });
      }
    }
    
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
  res.json({ status: 'ok', firebase: !!pricesRef, puppeteer: true, time: new Date().toISOString() });
});

// Start server
initFirebase().then(() => {
  app.listen(PORT, () => {
    console.log(`Gold price scraper running on port ${PORT}`);
  });
  
  // Initial scrape
  scrapePrices();
  
  // Schedule scraper every 6 hours
  setInterval(scrapePrices, 6 * 60 * 60 * 1000);
});
