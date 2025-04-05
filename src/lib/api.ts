import { 
  AlphaVantageTimeSeriesResponse, 
  AlphaVantageCompanyOverviewResponse,
  AlphaVantageNewsResponse,
  StockData,
  Metrics,
  StockProfile,
  NewsItem,
  Prediction,
  isIndianExchange,
  INDIAN_EXCHANGES
} from './types';
import { toast } from "sonner";

// In a production environment, this would be stored securely in environment variables
// For demo purposes, we're using a free API key with limited requests
const API_KEY = 'CBHAVG9EW7OVH03C';
const BASE_URL = 'https://www.alphavantage.co/query';

// Fetch historical stock data
export const fetchStockData = async (symbol: string): Promise<StockData[]> => {
  try {
    // Check if it's an Indian stock symbol (checking for NSE or BSE suffix)
    const isIndian = symbol.includes('.NS') || symbol.includes('.BSE') || 
                     INDIAN_EXCHANGES.some(ex => symbol.endsWith(`.${ex}`));
    
    // Always use the full symbol for Indian stocks
    const apiSymbol = symbol;
    
    const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${apiSymbol}&outputsize=full&apikey=${API_KEY}`;
    console.log(`Fetching stock data from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we got an error message from Alpha Vantage
    if ('Error Message' in data || 'Information' in data) {
      console.error('API returned error or empty data:', data);
      
      // For Indian stocks, try alternative exchange if one didn't work
      if (isIndian && symbol.includes('.NS')) {
        // Try BSE instead
        console.log('NSE lookup failed, trying BSE...');
        const bseSymbol = symbol.replace('.NS', '.BSE');
        return fetchStockData(bseSymbol);
      } else if (isIndian && !symbol.includes('.NS') && !symbol.includes('.BSE')) {
        // Try adding .NS suffix
        console.log('Trying with NSE suffix...');
        const nseSymbol = `${symbol}.NS`;
        return fetchStockData(nseSymbol);
      }
      
      throw new Error(data['Error Message'] || data['Information'] || 'No data returned from API');
    }
    
    // Check if response is empty
    if (!data || Object.keys(data).length === 0) {
      throw new Error(`No data returned for symbol: ${symbol}`);
    }
    
    // Check if Time Series data exists
    if (!data['Time Series (Daily)'] || Object.keys(data['Time Series (Daily)']).length === 0) {
      throw new Error(`No time series data found for symbol: ${symbol}`);
    }
    
    // Check if data is too old (more than 3 months)
    const dates = Object.keys(data['Time Series (Daily)']).sort().reverse();
    const latestDate = new Date(dates[0]);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    if (latestDate < threeMonthsAgo) {
      console.warn(`Data for ${symbol} is outdated (latest: ${latestDate.toISOString()})`);
      toast.warning(`Warning: Stock data for ${symbol} appears to be outdated`);
    }
    
    // Transform API data to our StockData format
    const stockData: StockData[] = Object.entries(data['Time Series (Daily)'])
      .map(([date, values]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'], 10)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return stockData;
  } catch (error) {
    console.error("Error fetching stock data:", error);
    throw error;
  }
};

// Fetch company overview data
export const fetchCompanyOverview = async (symbol: string): Promise<StockProfile> => {
  try {
    // Always use the full symbol for API call
    const apiSymbol = symbol;
    
    const url = `${BASE_URL}?function=OVERVIEW&symbol=${apiSymbol}&apikey=${API_KEY}`;
    console.log(`Fetching company overview from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: AlphaVantageCompanyOverviewResponse = await response.json();
    
    // Check if we got a valid response (Alpha Vantage returns an empty object for invalid symbols)
    if (!data || Object.keys(data).length === 0) {
      // If no data found, create a fallback profile with basic information
      console.log(`No company overview found for ${symbol}, using fallback data`);
      
      // Determine exchange from symbol
      let exchange = 'UNKNOWN';
      if (symbol.includes('.NS')) {
        exchange = 'NSE';
      } else if (symbol.includes('.BSE')) {
        exchange = 'BSE'; 
      } else if (['AAPL', 'MSFT', 'AMZN', 'GOOGL'].includes(symbol)) {
        exchange = 'NASDAQ';
      }
      
      const stockName = symbol.split('.')[0];
      
      return {
        symbol: symbol,
        name: stockName,
        description: `Information not available for ${stockName}`,
        industry: 'Not available',
        sector: 'Not available',
        employees: 0,
        ceo: 'Not available',
        website: 'Not available',
        exchange: exchange
      };
    }
    
    // Add exchange info for Indian stocks if not provided
    let exchange = data.Exchange || '';
    if ((symbol.includes('.NS') || symbol.includes('.BSE')) && !exchange) {
      exchange = symbol.includes('.NS') ? 'NSE' : symbol.includes('.BSE') ? 'BSE' : 'Indian Exchange';
    }
    
    // Transform API data to our StockProfile format
    return {
      symbol: data.Symbol || symbol,
      name: data.Name || symbol,
      description: data.Description || `No description available for ${symbol}`,
      industry: data.Industry || 'Not available',
      sector: data.Sector || 'Not available',
      employees: parseInt(data.FullTimeEmployees || '0', 10),
      ceo: data.CEO || 'Not available',
      website: data.Address || 'Not available',
      exchange: exchange || 'UNKNOWN'
    };
  } catch (error) {
    console.error("Error fetching company overview:", error);
    throw error;
  }
};

// Fetch metrics
export const fetchMetrics = async (symbol: string, stockData: StockData[]): Promise<Metrics> => {
  try {
    // Always use the full symbol for API call
    const apiSymbol = symbol;
    
    const url = `${BASE_URL}?function=OVERVIEW&symbol=${apiSymbol}&apikey=${API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: AlphaVantageCompanyOverviewResponse = await response.json();
    
    // Extract 52 week high/low from stock data
    const prices = stockData.map(d => d.close);
    const high52Week = parseFloat(data['52WeekHigh'] || Math.max(...prices).toString());
    const low52Week = parseFloat(data['52WeekLow'] || Math.min(...prices).toString());
    
    // Get the latest volume
    const volume = stockData.length > 0 ? stockData[stockData.length - 1].volume : 0;
    
    return {
      marketCap: parseInt(data.MarketCapitalization || '0', 10),
      peRatio: parseFloat(data.PERatio || '0'),
      dividendYield: parseFloat(data.DividendYield || '0') * 100, // Convert to percentage
      high52Week,
      low52Week,
      volume
    };
  } catch (error) {
    console.error("Error fetching metrics:", error);
    
    // Create fallback metrics from stock data if available
    if (stockData.length > 0) {
      const prices = stockData.map(d => d.close);
      const high52Week = Math.max(...prices);
      const low52Week = Math.min(...prices);
      const volume = stockData[stockData.length - 1].volume;
      
      return {
        marketCap: 0,
        peRatio: 0,
        dividendYield: 0,
        high52Week,
        low52Week,
        volume
      };
    }
    
    throw error;
  }
};

// Fetch news for a stock
export const fetchStockNews = async (symbol: string): Promise<NewsItem[]> => {
  try {
    // Always use the full symbol for API call, but remove exchange for news as it works better
    const baseSymbol = symbol.split('.')[0];
    
    const url = `${BASE_URL}?function=NEWS_SENTIMENT&tickers=${baseSymbol}&apikey=${API_KEY}`;
    console.log(`Fetching news from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for error or information messages
    if ('Information' in data) {
      console.warn('News API returned information:', data.Information);
      
      // Return placeholder news for stocks that don't have news
      return [
        {
          title: `No recent news found for ${symbol}`,
          date: new Date().toISOString(),
          source: "StockWhisperer",
          summary: "Try searching for news about this company on financial news sites.",
          url: "#"
        }
      ];
    }
    
    // Check if we got a valid feed
    if (!data.feed || !Array.isArray(data.feed) || data.feed.length === 0) {
      console.warn('No news feed available:', data);
      
      // Return placeholder news
      return [
        {
          title: `No recent news found for ${symbol}`,
          date: new Date().toISOString(),
          source: "StockWhisperer",
          summary: "Try searching for news about this company on financial news sites.",
          url: "#"
        }
      ];
    }
    
    // Transform API data to our NewsItem format
    return data.feed.slice(0, 3).map(item => ({
      title: item.title,
      date: new Date(item.time_published).toISOString(),
      source: item.source,
      summary: item.summary,
      url: item.url
    }));
  } catch (error) {
    console.error("Error fetching news:", error);
    
    // Return empty array instead of throwing to handle this gracefully
    return [
      {
        title: `Could not retrieve news for ${symbol}`,
        date: new Date().toISOString(),
        source: "StockWhisperer",
        summary: "There was an error fetching news for this stock. Please try again later.",
        url: "#"
      }
    ];
  }
};

// Generate predictions based on historical data and simple trend analysis
export const generatePredictions = (symbol: string, stockData: StockData[]): Prediction[] => {
  // Ensure we have enough data
  if (!stockData || stockData.length < 10) {
    return [
      {
        timeframe: 'Tomorrow',
        predictedPrice: 0,
        confidence: 0.3,
        recommendation: 'Hold',
        reasoning: 'Insufficient data to make a prediction.'
      },
      {
        timeframe: 'Next Week',
        predictedPrice: 0,
        confidence: 0.3,
        recommendation: 'Hold',
        reasoning: 'Insufficient data to make a prediction.'
      },
      {
        timeframe: 'Next Month',
        predictedPrice: 0,
        confidence: 0.3,
        recommendation: 'Hold',
        reasoning: 'Insufficient data to make a prediction.'
      }
    ];
  }
  
  const recentData = stockData.slice(-30); // Last 30 days
  const currentPrice = recentData[recentData.length - 1].close;
  
  // Calculate simple moving averages
  const sma5 = calculateSMA(recentData, 5);
  const sma20 = calculateSMA(recentData, 20);
  
  // Calculate price momentum
  const priceChange7d = (currentPrice - recentData[Math.max(recentData.length - 8, 0)].close) / 
                        recentData[Math.max(recentData.length - 8, 0)].close;
  const priceChange14d = (currentPrice - recentData[Math.max(recentData.length - 15, 0)].close) / 
                        recentData[Math.max(recentData.length - 15, 0)].close;
  
  // Calculate volatility (standard deviation of daily returns)
  const volatility = calculateVolatility(recentData);
  
  // Generate predictions with these signals
  return [
    generatePrediction('Tomorrow', 1, currentPrice, sma5, sma20, priceChange7d, volatility),
    generatePrediction('Next Week', 7, currentPrice, sma5, sma20, priceChange7d, volatility),
    generatePrediction('Next Month', 30, currentPrice, sma5, sma20, priceChange14d, volatility)
  ];
};

// Helper function to calculate Simple Moving Average
function calculateSMA(data: StockData[], period: number): number {
  if (data.length < period) return 0;
  
  const prices = data.slice(-period).map(d => d.close);
  return prices.reduce((sum, price) => sum + price, 0) / period;
}

// Helper function to calculate volatility
function calculateVolatility(data: StockData[]): number {
  if (data.length < 2) return 0;
  
  // Calculate daily returns
  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    returns.push((data[i].close - data[i-1].close) / data[i-1].close);
  }
  
  // Calculate standard deviation
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length;
  
  return Math.sqrt(variance);
}

// Helper function to generate a single prediction
function generatePrediction(
  timeframe: string, 
  daysFuture: number, 
  currentPrice: number,
  sma5: number,
  sma20: number,
  momentum: number,
  volatility: number
): Prediction {
  // Combine signals to determine trend
  const shortTermTrend = sma5 > currentPrice ? -0.01 : 0.01;
  const longTermTrend = sma20 > currentPrice ? -0.005 : 0.005;
  const momentumEffect = momentum * 3; // Scale momentum effect
  
  // More days into future means more uncertainty
  const uncertaintyFactor = 1 + (daysFuture / 50);
  const volatilityEffect = volatility * daysFuture * 2;
  
  // Calculate prediction
  const baseChange = (shortTermTrend + longTermTrend + momentumEffect) * daysFuture;
  const randomNoise = (Math.random() - 0.5) * volatilityEffect * uncertaintyFactor;
  const predictedChangePercent = baseChange + randomNoise;
  
  const predictedPrice = +(currentPrice * (1 + predictedChangePercent)).toFixed(2);
  
  // Determine confidence (lower for longer timeframes and higher volatility)
  const confidenceBase = 0.85;
  const confidenceAdjustment = (daysFuture / 100) + (volatility * 5);
  const confidence = Math.max(0.3, Math.min(0.95, confidenceBase - confidenceAdjustment));
  
  // Determine recommendation
  let recommendation: Prediction['recommendation'];
  let reasoning: string;
  
  const priceChangePercent = ((predictedPrice - currentPrice) / currentPrice) * 100;
  
  if (priceChangePercent > 5) {
    recommendation = 'Strong Buy';
    reasoning = `Our analysis indicates a potential ${priceChangePercent.toFixed(1)}% increase based on positive momentum and favorable technical indicators.`;
  } else if (priceChangePercent > 1.5) {
    recommendation = 'Buy';
    reasoning = `With a projected ${priceChangePercent.toFixed(1)}% rise, technical indicators suggest bullish movement in the ${timeframe} timeframe.`;
  } else if (priceChangePercent > -1.5) {
    recommendation = 'Hold';
    reasoning = `The stock shows mixed signals with a projected ${priceChangePercent.toFixed(1)}% change, suggesting a neutral position is appropriate.`;
  } else if (priceChangePercent > -5) {
    recommendation = 'Sell';
    reasoning = `A projected ${Math.abs(priceChangePercent).toFixed(1)}% decrease based on negative technical indicators suggests reducing exposure.`;
  } else {
    recommendation = 'Strong Sell';
    reasoning = `Our analysis forecasts a significant ${Math.abs(priceChangePercent).toFixed(1)}% decline due to negative momentum and bearish technical signals.`;
  }
  
  return {
    timeframe,
    predictedPrice,
    confidence,
    recommendation,
    reasoning
  };
}
