export interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Metrics {
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  high52Week: number;
  low52Week: number;
  volume: number;
}

export interface Prediction {
  timeframe: string;
  predictedPrice: number;
  confidence: number;
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  reasoning: string;
}

export interface NewsItem {
  title: string;
  date: string;
  source: string;
  summary: string;
  url: string;
}

export interface StockProfile {
  symbol: string;
  name: string;
  description: string;
  industry: string;
  sector: string;
  employees: number;
  ceo: string;
  website: string;
  exchange?: string; // Added exchange property
}

export interface AlphaVantageTimeSeriesResponse {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Output Size': string;
    '5. Time Zone': string;
  };
  'Time Series (Daily)': {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
    };
  };
}

export interface AlphaVantageCompanyOverviewResponse {
  Symbol: string;
  Name: string;
  Description: string;
  Sector: string;
  Industry: string;
  MarketCapitalization: string;
  PERatio: string;
  DividendYield: string;
  '52WeekHigh': string;
  '52WeekLow': string;
  FullTimeEmployees: string;
  Address: string;
  FiscalYearEnd: string;
  LatestQuarter: string;
  ProfitMargin: string;
  EVToEBITDA: string;
  CEO?: string;
  Exchange?: string; // Added Exchange property
}

export interface AlphaVantageNewsResponse {
  feed: {
    title: string;
    url: string;
    time_published: string;
    authors: string[];
    summary: string;
    banner_image?: string;
    source: string;
    category_within_source: string;
    source_domain: string;
  }[];
}

// Indian stock exchanges
export const INDIAN_EXCHANGES = ['NSE', 'BSE'];

// Function to check if a stock is from an Indian exchange
export const isIndianExchange = (exchange: string = ''): boolean => {
  return INDIAN_EXCHANGES.includes(exchange.toUpperCase()) || 
         exchange.includes('NSE') || 
         exchange.includes('BSE');
};

// Function to check if a symbol is likely an Indian stock
export const isIndianStock = (symbol: string): boolean => {
  return symbol.endsWith('.NS') || symbol.endsWith('.BSE');
};

// Currency symbols
export const CURRENCY_SYMBOLS = {
  USD: '$',
  INR: '₹',
};

// Function to get the currency symbol based on exchange
export const getCurrencySymbol = (exchange: string = ''): string => {
  return isIndianExchange(exchange) ? CURRENCY_SYMBOLS.INR : CURRENCY_SYMBOLS.USD;
};

// Function to format currency based on exchange
export const formatCurrency = (amount: number, exchange: string = ''): string => {
  const currency = isIndianExchange(exchange) ? 'INR' : 'USD';
  const currencySymbol = getCurrencySymbol(exchange);
  
  // Format the number with appropriate thousands separators
  return currencySymbol + amount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
};
