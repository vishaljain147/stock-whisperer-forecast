
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
}
