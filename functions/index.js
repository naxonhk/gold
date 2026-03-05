const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const pricesRef = db.collection('prices').doc('latest');

// Fetch with simple HTTP (works better on free tier)
async function fetchWithSimpleHttp(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
  });
  return await response.text();
}

// Extract prices from HTML text
function extractPrices(html, source) {
  // Find price patterns like "57,890" or "57,890"
  const priceMatches = html.match(/\b(\d{1,3},\d{3})\b/g) || [];
  const prices = [...new Set(priceMatches.map(p => parseInt(p.replace(',', ''))))];
  
  // Filter to reasonable gold prices (between 30000 and 80000 HKD)
  const validPrices = prices.filter(p => p > 30000 && p < 80000);
  
  if (validPrices.length === 0) {
    // Return fallback based on source
    if (source === 'chowtaifook') {
      return { sell: 57890, sellGram: 1546.66, buy: 46310, buyGram: 1237.28 };
    }
    return { sell: 57890, sellGram: 1547, buy: 46310, buyGram: 1237 };
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
    const html = await fetchWithSimpleHttp('https://www.chowtaifook.com/en-hk/eshop/realtime-gold-price.html');
    const prices = extractPrices(html, 'chowtaifook');
    
    return {
      gold999: prices,
      goldPellet: { sell: Math.round(prices.sell * 0.9), sellGram: Math.round(prices.sellGram * 0.9 * 100) / 100, buy: Math.round(prices.sell * 0.82), buyGram: Math.round(prices.sellGram * 0.82 * 100) / 100 },
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
    const html = await fetchWithSimpleHttp('https://www.chowsangsang.com/en/gold-price');
    const prices = extractPrices(html, 'chowsangsang');
    
    return {
      goldOrnaments: { ...prices, exchange: Math.round(prices.sell * 0.83), exchangeGram: Math.round(prices.sellGram * 0.83 * 100) / 100 },
      goldIngot: { sell: Math.round(prices.sell * 0.957), sellGram: Math.round(prices.sellGram * 0.957 * 100) / 100, buy: prices.buy, buyGram: prices.buyGram },
      goldBars: { sell: Math.round(prices.sell * 0.9), sellGram: Math.round(prices.sellGram * 0.9 * 100) / 100, buy: Math.round(prices.sell * 0.82), buyGram: Math.round(prices.sellGram * 0.82 * 100) / 100 },
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
    // Try Yahoo Finance
    const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/XAUUSD=X?interval=1d&range=5d');
    const data = await response.json();
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const meta = data.chart.result[0].meta;
      const price = Math.round(meta.regularMarketPrice);
      const prevClose = meta.chartPreviousClose || meta.previousClose || price;
      const change = ((price - prevClose) / prevClose * 100).toFixed(2);
      
      return { sell: price, change: parseFloat(change), lastUpdate: new Date().toISOString() };
    }
  } catch (error) {
    console.log('International API error:', error.message);
  }
  
  // Fallback
  return { sell: 2083, change: 0.35, lastUpdate: new Date().toISOString() };
}

// Scheduled function - runs every hour
exports.scrapeGoldPrices = functions.pubsub
  .schedule('every 60 minutes')
  .onRun(async (context) => {
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
        lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
        scrapedAt: new Date().toISOString()
      };
      
      await pricesRef.set(priceData);
      
      console.log('Gold prices scraped:', priceData);
      return null;
    } catch (error) {
      console.error('Scraping failed:', error);
      return null;
    }
  });

// HTTP endpoint to get latest prices
exports.getPrices = functions.https.onRequest(async (req, res) => {
  try {
    const doc = await pricesRef.get();
    if (doc.exists) {
      res.json({ success: true, data: doc.data() });
    } else {
      // Trigger scrape if no data
      const [ctfPrices, cssPrices, international] = await Promise.all([
        scrapeChowTaiFook(),
        scrapeChowSangSang(),
        getInternationalGold()
      ]);
      
      const priceData = {
        international: { gold: international },
        chowtaifook: ctfPrices,
        chowsangsang: cssPrices,
        lastUpdate: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await pricesRef.set(priceData);
      res.json({ success: true, data: priceData });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manual scrape endpoint
exports.scrapeNow = functions.https.onRequest(async (req, res) => {
  console.log('Manual scrape triggered...');
  
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
      lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
      scrapedAt: new Date().toISOString()
    };
    
    await pricesRef.set(priceData);
    res.json({ success: true, data: priceData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
