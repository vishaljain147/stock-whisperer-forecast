import { StockData, Metrics, Prediction, NewsItem, StockProfile } from './types';

// Helper function to generate random stock data with realistic trends
export const generateStockData = (symbol: string, days: number): StockData[] => {
  const today = new Date();
  const data: StockData[] = [];
  
  // Base prices for common stocks
  const basePrices: Record<string, number> = {
    'AAPL': 180.95,
    'MSFT': 410.34,
    'GOOGL': 160.82,
    'AMZN': 175.80,
    'TSLA': 225.47,
    'DEFAULT': 150.00
  };
  
  let basePrice = basePrices[symbol] || basePrices['DEFAULT'];
  let lastClose = basePrice;
  
  // Generate data for the specified number of days
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }
    
    // Generate random price movements with some trend
    const change = (Math.random() - 0.48) * (basePrice * 0.02); // Slightly biased towards up
    const open = lastClose;
    const close = +(open + change).toFixed(2);
    
    // High is the max of open and close plus some random amount
    const highAdd = Math.random() * basePrice * 0.01;
    const high = +Math.max(open, close + highAdd).toFixed(2);
    
    // Low is the min of open and close minus some random amount
    const lowSubtract = Math.random() * basePrice * 0.01;
    const low = +Math.min(open, close - lowSubtract).toFixed(2);
    
    // Volume varies between stocks but typically in millions
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume
    });
    
    lastClose = close;
  }
  
  return data;
};

// Generate metrics based on stock symbol and price data
export const generateMetrics = (symbol: string, stockData: StockData[]): Metrics => {
  const latestPrice = stockData[stockData.length - 1]?.close || 100;
  
  // Base metrics that vary by stock
  const baseMetrics: Record<string, Partial<Metrics>> = {
    'AAPL': { 
      marketCap: 2900000000000, 
      peRatio: 32.5, 
      dividendYield: 0.48
    },
    'MSFT': { 
      marketCap: 3100000000000, 
      peRatio: 37.8, 
      dividendYield: 0.72
    },
    'GOOGL': { 
      marketCap: 2000000000000, 
      peRatio: 26.4, 
      dividendYield: 0
    },
    'AMZN': { 
      marketCap: 1780000000000, 
      peRatio: 43.2, 
      dividendYield: 0
    },
    'TSLA': { 
      marketCap: 712000000000, 
      peRatio: 55.7, 
      dividendYield: 0
    },
    'DEFAULT': { 
      marketCap: 500000000000, 
      peRatio: 25, 
      dividendYield: 1.5
    }
  };
  
  const baseMetric = baseMetrics[symbol] || baseMetrics['DEFAULT'];
  
  // Calculate high and low from the past year
  const prices = stockData.map(d => d.close);
  const high52Week = Math.max(...prices) * 1.05; // Add 5% to make it realistic
  const low52Week = Math.min(...prices) * 0.95; // Subtract 5% to make it realistic
  
  // Get the latest volume
  const volume = stockData[stockData.length - 1]?.volume || 5000000;
  
  return {
    marketCap: baseMetric.marketCap as number,
    peRatio: baseMetric.peRatio as number,
    dividendYield: baseMetric.dividendYield as number,
    high52Week,
    low52Week,
    volume
  };
};

// Generate predictions based on stock symbol and current price
export const generatePredictions = (symbol: string, currentPrice: number): Prediction[] => {
  // Base prediction characteristics
  const predictionBias: Record<string, number> = {
    'AAPL': 0.02, // Slightly bullish
    'MSFT': 0.03, // Bullish
    'GOOGL': 0.01, // Slightly bullish
    'AMZN': 0.015, // Slightly bullish
    'TSLA': -0.01, // Slightly bearish
    'DEFAULT': 0 // Neutral
  };
  
  const bias = predictionBias[symbol] || predictionBias['DEFAULT'];
  
  // Function to generate a single prediction
  const generatePrediction = (timeframe: string, daysFuture: number): Prediction => {
    // More days into the future means less confidence and more volatility
    const volatilityFactor = 1 + (daysFuture / 30);
    const confidenceDecay = daysFuture / 100;
    
    // Random movement adjusted by bias and volatility
    const priceMovementPercent = ((Math.random() - 0.48) * 0.05 * volatilityFactor) + (bias * daysFuture / 10);
    const predictedPrice = +(currentPrice * (1 + priceMovementPercent)).toFixed(2);
    
    // Confidence decreases with time into future
    const baseConfidence = 0.85;
    const confidence = Math.max(0.3, baseConfidence - confidenceDecay);
    
    // Determine recommendation based on price movement and confidence
    let recommendation: Prediction['recommendation'];
    let reasoning: string;
    
    const priceChangePercent = ((predictedPrice - currentPrice) / currentPrice) * 100;
    
    if (priceChangePercent > 5) {
      recommendation = 'Strong Buy';
      reasoning = `Our analysis indicates a potential ${priceChangePercent.toFixed(1)}% increase, suggesting strong upward momentum.`;
    } else if (priceChangePercent > 2) {
      recommendation = 'Buy';
      reasoning = `With a projected ${priceChangePercent.toFixed(1)}% rise, this stock shows promising growth potential in the ${timeframe} timeframe.`;
    } else if (priceChangePercent > -2) {
      recommendation = 'Hold';
      reasoning = `The stock is expected to remain relatively stable with a ${priceChangePercent.toFixed(1)}% change, suggesting a holding position is appropriate.`;
    } else if (priceChangePercent > -5) {
      recommendation = 'Sell';
      reasoning = `A projected ${Math.abs(priceChangePercent).toFixed(1)}% decrease indicates potential downside risk, suggesting reducing exposure.`;
    } else {
      recommendation = 'Strong Sell';
      reasoning = `Our analysis forecasts a significant ${Math.abs(priceChangePercent).toFixed(1)}% decline, indicating strong selling pressure ahead.`;
    }
    
    return {
      timeframe,
      predictedPrice,
      confidence,
      recommendation,
      reasoning
    };
  };
  
  return [
    generatePrediction('Tomorrow', 1),
    generatePrediction('Next Week', 7),
    generatePrediction('Next Month', 30)
  ];
};

// Generate mock news for a stock
export const generateNews = (symbol: string): NewsItem[] => {
  const baseNews: Record<string, NewsItem[]> = {
    'AAPL': [
      {
        title: 'Apple Reports Record Quarter Despite Supply Chain Challenges',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'Financial Times',
        summary: 'Apple Inc. reported a record-breaking quarter with iPhone sales exceeding analyst expectations, despite ongoing global supply chain disruptions.',
        url: '#'
      },
      {
        title: 'Apple Unveils Next Generation of M-Series Chips',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'TechCrunch',
        summary: 'The new processors promise significant performance and efficiency gains across the Mac lineup.',
        url: '#'
      }
    ],
    'MSFT': [
      {
        title: 'Microsoft Cloud Business Continues Strong Growth',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'Bloomberg',
        summary: 'Microsoft\'s Azure cloud services grew 40% year-over-year, continuing to drive the company\'s overall growth.',
        url: '#'
      },
      {
        title: 'Microsoft Expands AI Integration Across Product Line',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'CNBC',
        summary: 'New AI features coming to Office, Windows, and developer tools as Microsoft doubles down on artificial intelligence.',
        url: '#'
      }
    ]
  };
  
  // Generic news templates that can be used for any stock
  const genericNewsTemplates = [
    {
      title: '{COMPANY} Beats Earnings Expectations in Q2',
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'Wall Street Journal',
      summary: 'Analysts are raising price targets following better-than-expected quarterly results.',
      url: '#'
    },
    {
      title: '{COMPANY} Announces Share Buyback Program',
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'Reuters',
      summary: 'The board has authorized a $10 billion share repurchase program, signaling confidence in the company\'s future.',
      url: '#'
    },
    {
      title: 'Analyst Downgrades {SYMBOL} Citing Valuation Concerns',
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'Barron\'s',
      summary: 'The stock may be fully valued at current levels, according to a new analyst report.',
      url: '#'
    }
  ];
  
  // If we have predefined news for this symbol, use it
  if (baseNews[symbol]) {
    return baseNews[symbol];
  }
  
  // Otherwise generate generic news
  const companyName = getCompanyName(symbol);
  
  return genericNewsTemplates.map(template => ({
    ...template,
    title: template.title.replace('{COMPANY}', companyName).replace('{SYMBOL}', symbol),
    summary: template.summary.replace('{COMPANY}', companyName).replace('{SYMBOL}', symbol)
  }));
};

// Get company name from symbol
function getCompanyName(symbol: string): string {
  const companies: Record<string, string> = {
    'AAPL': 'Apple',
    'MSFT': 'Microsoft',
    'GOOGL': 'Alphabet',
    'AMZN': 'Amazon',
    'TSLA': 'Tesla',
    'META': 'Meta Platforms',
    'NVDA': 'NVIDIA',
    'JPM': 'JPMorgan Chase'
  };
  
  return companies[symbol] || symbol;
}

// Generate stock profile based on symbol
export const generateStockProfile = (symbol: string): StockProfile => {
  const profiles: Record<string, StockProfile> = {
    'AAPL': {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, Mac, iPad, and wearables, home, and accessories.',
      industry: 'Consumer Electronics',
      sector: 'Technology',
      employees: 164000,
      ceo: 'Tim Cook',
      website: 'https://www.apple.com'
    },
    'MSFT': {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. The company operates through Productivity and Business Processes, Intelligent Cloud, and More Personal Computing segments.',
      industry: 'Software—Infrastructure',
      sector: 'Technology',
      employees: 221000,
      ceo: 'Satya Nadella',
      website: 'https://www.microsoft.com'
    },
    'GOOGL': {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      description: 'Alphabet Inc. offers various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America. It operates through Google Services, Google Cloud, and Other Bets segments.',
      industry: 'Internet Content & Information',
      sector: 'Technology',
      employees: 190234,
      ceo: 'Sundar Pichai',
      website: 'https://abc.xyz'
    },
    'AMZN': {
      symbol: 'AMZN',
      name: 'Amazon.com, Inc.',
      description: 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions through online and physical stores in North America and internationally. It operates through e-commerce, AWS, and advertising segments.',
      industry: 'Internet Retail',
      sector: 'Consumer Cyclical',
      employees: 1540000,
      ceo: 'Andy Jassy',
      website: 'https://www.amazon.com'
    },
    'TSLA': {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems in the United States, China, and internationally.',
      industry: 'Auto Manufacturers',
      sector: 'Consumer Cyclical',
      employees: 140473,
      ceo: 'Elon Musk',
      website: 'https://www.tesla.com'
    }
  };
  
  // Return profile if it exists, otherwise create a generic one
  if (profiles[symbol]) {
    return profiles[symbol];
  }
  
  return {
    symbol,
    name: `${symbol} Corporation`,
    description: `${symbol} operates in various business segments and markets worldwide.`,
    industry: 'General',
    sector: 'Mixed',
    employees: Math.floor(Math.random() * 100000) + 1000,
    ceo: 'John Doe',
    website: `https://www.${symbol.toLowerCase()}.com`
  };
};
