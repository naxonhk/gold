// lib/prices.js - Static gold price data with history for graph
export const PRICE_HISTORY = {
  labels: ['3/1', '3/2', '3/3', '3/4', '3/5'],
  chowtaifook: {
    gold999: [57650, 57720, 57800, 57850, 57890],
    goldPellet: [51800, 51950, 52000, 52080, 52120]
  },
  chowsangsang: {
    goldOrnaments: [57650, 57720, 57800, 57850, 57890],
    goldBars: [51800, 51950, 52000, 52080, 52110]
  }
};

export const DEFAULT_PRICES = {
  chowtaifook: { 
    gold999: { sell: 57890, sellGram: 1546.66, buy: 46310, buyGram: 1237.28 }, 
    goldPellet: { sell: 52120, sellGram: 1392.5, buy: 47520, buyGram: 1269.6 },
    goldRedemption: { buy: 47810, buyGram: 1277.35 }
  },
  chowsangsang: { 
    goldOrnaments: { sell: 57890, sellGram: 1547, exchange: 48050, exchangeGram: 1283, buy: 46310, buyGram: 1237 }, 
    goldIngot: { sell: 55370, sellGram: 1480, buy: 46310, buyGram: 1237 }, 
    goldBars: { sell: 52110, sellGram: 1393, buy: 47520, buyGram: 1269 }
  }
};
