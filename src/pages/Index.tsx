
import React, { useState } from 'react';
import Header from '@/components/Header';
import StockSearch from '@/components/StockSearch';
import StockChart from '@/components/StockChart';
import PredictionCard from '@/components/PredictionCard';
import KeyMetrics from '@/components/KeyMetrics';
import StockNews from '@/components/StockNews';
import Watchlist from '@/components/Watchlist';
import ThemeToggle from '@/components/ThemeToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Prediction, StockData, Metrics, NewsItem, StockProfile, isIndianStock } from '@/lib/types';
import { 
  fetchStockData, 
  fetchCompanyOverview, 
  fetchMetrics, 
  fetchStockNews, 
  generatePredictions 
} from '@/lib/api';

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [stockProfile, setStockProfile] = useState<StockProfile | null>(null);
  const [activeTimeframe, setActiveTimeframe] = useState<string>('Tomorrow');
  const [currentSymbol, setCurrentSymbol] = useState<string>('');

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    
    try {
      const symbol = query.toUpperCase();
      setCurrentSymbol(symbol);
      console.log(`Starting search for: ${symbol}`);
      
      // Check if it's an Indian stock for better messaging
      const isIndian = isIndianStock(symbol);
      if (isIndian) {
        console.log(`Detected Indian stock: ${symbol}`);
      }
      
      // Fetch stock data first
      let stockData;
      try {
        stockData = await fetchStockData(symbol);
        setStockData(stockData);
        console.log(`Successfully set stock data with ${stockData.length} data points`);
      } catch (error) {
        console.error('Error fetching stock data:', error);
        toast.error(`Failed to fetch stock data for ${symbol}`);
        setIsLoading(false);
        return;
      }
      
      // Use Promise.all to fetch other data in parallel
      try {
        const [companyOverview, stockNews] = await Promise.all([
          fetchCompanyOverview(symbol),
          fetchStockNews(symbol)
        ]);
        
        setStockProfile(companyOverview);
        setNews(stockNews);
        console.log(`Set company profile and news for ${symbol}`);
      } catch (error) {
        console.error('Error fetching company data or news:', error);
        // Continue with partial data
      }
      
      // Fetch metrics using the stock data we already have
      try {
        const metrics = await fetchMetrics(symbol, stockData);
        setMetrics(metrics);
        console.log(`Set metrics for ${symbol}`);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        // Continue with partial data
      }
      
      // Generate predictions based on the data
      try {
        const currentPrice = stockData[stockData.length - 1]?.close || 0;
        const predictions = generatePredictions(symbol, stockData);
        setPredictions(predictions);
        console.log(`Generated predictions for ${symbol}`);
      } catch (error) {
        console.error('Error generating predictions:', error);
        // Continue with partial data
      }
      
      setIsLoading(false);
      toast.success(`Analysis complete for ${symbol}`);
      
    } catch (error) {
      console.error('Error in search process:', error);
      toast.error('Error fetching stock data. Please try again.');
      setIsLoading(false);
    }
  };

  const refreshCurrentStock = async () => {
    if (!currentSymbol) return;
    
    try {
      // No need to show loading state for refresh
      console.log(`Refreshing data for: ${currentSymbol}`);
      
      // Fetch new stock data
      const freshStockData = await fetchStockData(currentSymbol);
      setStockData(freshStockData);
      
      // Update predictions
      const updatedPredictions = generatePredictions(currentSymbol, freshStockData);
      setPredictions(updatedPredictions);
      
      // Update metrics
      const updatedMetrics = await fetchMetrics(currentSymbol, freshStockData);
      setMetrics(updatedMetrics);
      
      toast.success(`Data updated for ${currentSymbol}`, {
        duration: 2000,
      });
      
      return;
    } catch (error) {
      console.error('Error refreshing stock data:', error);
      toast.error('Could not refresh stock data');
    }
  };

  const currentPrice = stockData.length > 0 ? stockData[stockData.length - 1].close : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header>
        <ThemeToggle />
      </Header>
      
      <main className="flex-1 container py-8">
        <div className="grid gap-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Stock Market Price Analyzer</h2>
            <StockSearch onSearch={handleSearch} isLoading={isLoading} />
          </div>
          
          <div className="grid lg:grid-cols-7 gap-6">
            <div className="lg:col-span-2">
              <Watchlist onSelectStock={handleSearch} />
            </div>
            
            <div className="lg:col-span-5">
              {stockData.length > 0 && stockProfile && (
                <div className="grid gap-8 animate-fade-in">
                  <div>
                    <StockChart 
                      data={stockData}
                      stockSymbol={stockProfile.symbol}
                      companyName={stockProfile.name}
                      exchange={stockProfile.exchange || "NASDAQ"}
                      onRefreshData={refreshCurrentStock}
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Company Profile</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-4">
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Industry</dt>
                            <dd>{stockProfile.industry}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Sector</dt>
                            <dd>{stockProfile.sector}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">CEO</dt>
                            <dd>{stockProfile.ceo}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Employees</dt>
                            <dd>{stockProfile.employees.toLocaleString()}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                            <dd className="text-sm">{stockProfile.description}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                    
                    {metrics && <KeyMetrics metrics={metrics} />}
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Price Predictions & Analysis</h3>
                    
                    <Tabs defaultValue="Tomorrow" onValueChange={setActiveTimeframe}>
                      <TabsList className="mb-4">
                        {predictions.map(pred => (
                          <TabsTrigger key={pred.timeframe} value={pred.timeframe}>
                            {pred.timeframe}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      
                      {predictions.map(prediction => (
                        <TabsContent key={prediction.timeframe} value={prediction.timeframe}>
                          <PredictionCard prediction={prediction} currentPrice={currentPrice} />
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                  
                  <StockNews news={news} />
                </div>
              )}
              
              {!stockData.length && !isLoading && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-medium mb-2">Welcome to StockWhisperer</h3>
                      <p className="text-muted-foreground">
                        Enter a stock symbol above or select one from the watchlist
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                      <FeatureCard 
                        title="Real-Time Data" 
                        description="View interactive charts with real historical price movements"
                      />
                      <FeatureCard 
                        title="Price Predictions" 
                        description="Get data-driven price forecasts for different timeframes"
                      />
                      <FeatureCard 
                        title="Trading Signals" 
                        description="Receive buy, sell, or hold recommendations based on technical analysis"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>StockWhisperer - Stock Market Price Analyzer</p>
          <p className="mt-1">
            Data provided by Alpha Vantage API. For personal use only.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ title, description }: { title: string; description: string }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <CardDescription>{description}</CardDescription>
    </CardContent>
  </Card>
);

export default Index;
