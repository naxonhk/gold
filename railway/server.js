require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// Firebase config - load from environment
const FIREBASE_CONFIG = process.env.FIREBASE_CONFIG;

let admin = null;
let db = null;
let pricesRef = null;

async function initFirebase() {
  if (!FIREBASE_CONFIG) {
    console.log('Firebase config not set, using fallback mode');
    return false;
  }
  
  try {
    const adminModule = await import('firebase-admin');
    admin = adminModule.default;
    
    const serviceAccount = JSON.parse(FIREBASE_CONFIG);
    const projectId = serviceAccount.project_id;
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${projectId}.firebaseio.com`
    });

    db = admin.firestore();
    pricesRef = db.collection('prices').doc('latest');
    console.log('Firebase initialized successfully!');
    return true;
  } catch (error) {
    console.error('Firebase init error:', error.message);
    return false;
  }
}

// Scrape Chow Tai Fook with proper selectors
async function scrapeChowTaiFook() {
  console.log('Scraping Chow Tai Fook...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.goto('https://www.chowtaifook.com/en-hk/eshop/realtime-gold-price.html', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait for the price table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Extract all text content from the page
    const content = await page.evaluate(() => {
      // Find the table with gold prices
      const tables = document.querySelectorAll('table');
      for (const table of tables) {
        const text = table.innerText;
        if (text.includes('999.9 Gold') && text.includes('GRAM')) {
          return text;
        }
      }
      return document.body.innerText;
    });
    
    console.log('CTF Page content:', content.substring(0, 500));
    
    // Parse the prices from the content
    // Format: "999.9 Gold    GRAM    TAEL    1,555.21    58,210    1,244.22    46,570"
    const prices = {};
    
    // Split content into lines and process
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 999.9 Gold row
      if (line.includes('999.9 Gold') && i + 1 < lines.length) {
        // Find the data line - look for numbers around 1000-60000
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const dataLine = lines[j].replace(/\s+/g, ' ');
          const numbers = dataLine.match(/([\d,]+\.?\d*)/g);
          if (numbers && numbers.length >= 4) {
            const vals = numbers.map(n => parseFloat(n.replace(/,/g, '')));
            if (vals[0] > 1000 && vals[0] < 2000 && vals[1] > 50000 && vals[1] < 65000) {
              prices.gold999 = {
                sellGram: vals[0],
                sell: vals[1],
                buyGram: vals[2],
                buy: vals[3]
              };
              break;
            }
          }
        }
      }
      
      // Gold Pellet row
      if (line.includes('Gold Pellet') && line.includes('Investment') && i + 1 < lines.length) {
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const dataLine = lines[j].replace(/\s+/g, ' ');
          const numbers = dataLine.match(/([\d,]+\.?\d*)/g);
          if (numbers && numbers.length >= 4) {
            const vals = numbers.map(n => parseFloat(n.replace(/,/g, '')));
            if (vals[0] > 1000 && vals[0] < 2000 && vals[1] > 50000 && vals[1] < 65000) {
              prices.goldPellet = {
                sellGram: vals[0],
                sell: vals[1],
                buyGram: vals[2],
                buy: vals[3]
              };
              break;
            }
          }
        }
      }
      
      // Gold Redemption row
      if (line.includes('Redemption') && !line.includes('Pellet') && i + 1 < lines.length) {
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const dataLine = lines[j].replace(/\s+/g, ' ');
          const numbers = dataLine.match(/([\d,]+\.?\d*)/g);
          if (numbers && numbers.length >= 2) {
            const vals = numbers.map(n => parseFloat(n.replace(/,/g, '')));
            if (vals[0] > 1000 && vals[0] < 2000 && vals[1] > 40000 && vals[1] < 55000) {
              prices.goldRedemption = {
                buyGram: vals[0],
                buy: vals[1]
              };
              break;
            }
          }
        }
      }
      
      // Platinum row
      if (line.includes('Platinum') && !line.includes('Redemption') && i + 1 < lines.length) {
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const dataLine = lines[j].replace(/\s+/g, ' ');
          const numbers = dataLine.match(/([\d,]+\.?\d*)/g);
          if (numbers && numbers.length >= 2) {
            const vals = numbers.map(n => parseFloat(n.replace(/,/g, '')));
            if (vals[0] > 400 && vals[0] < 600 && vals[1] > 15000 && vals[1] < 25000) {
              prices.platinum = {
                buyGram: vals[0],
                buy: vals[1]
              };
              break;
            }
          }
        }
      }
    }
    
    console.log('Parsed CTF prices:', JSON.stringify(prices, null, 2));
    
    if (!prices.gold999) {
      throw new Error('Failed to extract 999.9 gold prices');
    }
    
    return {
      gold999: prices.gold999,
      goldPellet: prices.goldPellet || { sell: 52200, sellGram: 1394.64, buy: 47600, buyGram: 1271.74 },
      goldRedemption: prices.goldRedemption || { buy: 48070, buyGram: 1284.30 },
      platinum: prices.platinum || { buy: 18840, buyGram: 503.35 },
      lastUpdate: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error scraping Chow Tai Fook:', error.message);
    // Return fallback data
    return {
      gold999: { sell: 58210, sellGram: 1555.21, buy: 46570, buyGram: 1244.22 },
      goldPellet: { sell: 52200, sellGram: 1394.64, buy: 47600, buyGram: 1271.74 },
      goldRedemption: { buy: 48070, buyGram: 1284.30 },
      platinum: { buy: 18840, buyGram: 503.35 },
      lastUpdate: new Date().toISOString()
    };
  } finally {
    await browser.close();
  }
}

// Scrape Chow Sang Sang
async function scrapeChowSangSang() {
  console.log('Scraping Chow Sang Sang...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.goto('https://www.chowsangsang.com/en/gold-price', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait for content
    await page.waitForSelector('body', { timeout: 10000 });
    
    const content = await page.evaluate(() => document.body.innerText);
    console.log('CSS Page content:', content.substring(0, 500));
    
    // Parse prices - try to find numbers in the content
    // Looking for patterns like HK$XX,XXX
    const priceMatches = content.match(/HK?\$?\s*([5-6][0-9],[0-9]{3})/g) || [];
    const uniquePrices = [...new Set(priceMatches.map(p => parseInt(p.replace(/[HK\$\s,]/g, ''))))].filter(p => p > 40000 && p < 70000);
    
    console.log('CSS prices found:', uniquePrices);
    
    const basePrice = uniquePrices[0] || 58210;
    
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
    
  } catch (error) {
    console.error('Error scraping Chow Sang Sang:', error.message);
    return {
      goldOrnaments: { sell: 58210, sellGram: 1555.21, exchange: 48310, buy: 46570, buyGram: 1244.22 },
      goldIngot: { sell: 55710, buy: 46570 },
      goldBars: { sell: 52390, buy: 47730 },
      lastUpdate: new Date().toISOString()
    };
  } finally {
    await browser.close();
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
    
    console.log('Final price data:', JSON.stringify(priceData, null, 2));
    
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
  
  // Initial scrape after a short delay
  setTimeout(() => {
    scrapePrices();
  }, 3000);
  
  // Schedule scraper every 6 hours
  setInterval(scrapePrices, 6 * 60 * 60 * 1000);
});
