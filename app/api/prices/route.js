// app/api/prices/route.js
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Local cache as fallback
let localCache = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000;

// Note: In production, you'd use Firebase Admin SDK server-side
// For now, we'll try to fetch from your Firebase Functions URL
// You need to deploy the functions and set this URL

const FIREBASE_FUNCTION_URL = process.env.FIREBASE_FUNCTION_URL || '';

async function fetchFromFirebase() {
  if (!FIREBASE_FUNCTION_URL) return null;
  
  try {
    const response = await fetch(FIREBASE_FUNCTION_URL, {
      next: { revalidate: 60 }
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (error) {
    console.log('Firebase fetch failed:', error.message);
  }
  return null;
}

// Fallback prices when Firebase is not available
function getFallbackPrices() {
  return {
    international: {
      gold: { sell: 2083, change: 0.35, lastUpdate: new Date().toISOString() }
    },
    chowtaifook: { 
      gold999: { sell: 57890, sellGram: 1546.66, buy: 46310, buyGram: 1237.28 },
      goldPellet: { sell: 52120, sellGram: 1392.5, buy: 47520, buyGram: 1269.6 },
      goldRedemption: { buy: 47810, buyGram: 1277.35 },
      lastUpdate: new Date().toISOString(),
      note: 'Estimated prices - update via Firebase'
    },
    chowsangsang: { 
      goldOrnaments: { sell: 57890, sellGram: 1547, exchange: 48050, buy: 46310, buyGram: 1237 },
      goldIngot: { sell: 55370, sellGram: 1480, buy: 46310, buyGram: 1237 },
      goldBars: { sell: 52110, sellGram: 1393, buy: 47520, buyGram: 1269 },
      lastUpdate: new Date().toISOString(),
      note: 'Estimated prices - update via Firebase'
    },
    lastUpdate: new Date().toISOString(),
    source: 'fallback'
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === 'true';
  const now = Date.now();
  
  // Check local cache first
  if (!force && localCache && (now - lastFetch) < CACHE_DURATION) {
    return NextResponse.json({
      success: true,
      data: localCache,
      cached: true,
      lastUpdate: localCache.lastUpdate,
      source: 'cache'
    });
  }
  
  // Try Firebase if URL is configured
  if (FIREBASE_FUNCTION_URL) {
    const firebaseData = await fetchFromFirebase();
    if (firebaseData) {
      localCache = firebaseData;
      lastFetch = now;
      return NextResponse.json({
        success: true,
        data: firebaseData,
        cached: false,
        lastUpdate: firebaseData.lastUpdate,
        source: 'firebase'
      });
    }
  }
  
  // Return fallback with note
  const fallbackData = getFallbackPrices();
  localCache = fallbackData;
  lastFetch = now;
  
  return NextResponse.json({
    success: true,
    data: fallbackData,
    cached: false,
    lastUpdate: fallbackData.lastUpdate,
    source: 'fallback',
    message: 'Using estimated prices. Set FIREBASE_FUNCTION_URL to enable real-time scraping.'
  });
}
