
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Trash2, ExternalLink, Bell, Star, StarOff, X } from "lucide-react";
import { toast } from "sonner";
import { StockProfile } from '@/lib/types';

interface WatchlistProps {
  onSelectStock: (symbol: string) => void;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  exchange: string;
  lastPrice?: number;
  change?: number;
  changePercent?: number;
}

const INDIAN_POPULAR_STOCKS: WatchlistItem[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE" },
  { symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE" },
  { symbol: "HDFCBANK", name: "HDFC Bank", exchange: "NSE" },
  { symbol: "INFY", name: "Infosys", exchange: "NSE" },
  { symbol: "ICICIBANK", name: "ICICI Bank", exchange: "NSE" },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", exchange: "NSE" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", exchange: "NSE" },
  { symbol: "ITC", name: "ITC", exchange: "NSE" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", exchange: "NSE" }
];

const US_POPULAR_STOCKS: WatchlistItem[] = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ" }
];

const Watchlist: React.FC<WatchlistProps> = ({ onSelectStock }) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    const saved = localStorage.getItem('watchlist');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedMarket, setSelectedMarket] = useState<"US" | "INDIA">("US");
  const [newSymbol, setNewSymbol] = useState("");
  const [favoriteStocks, setFavoriteStocks] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('favorites');
    return new Set(saved ? JSON.parse(saved) : []);
  });

  const handleAddToWatchlist = (stock: WatchlistItem) => {
    if (!watchlist.some(item => item.symbol === stock.symbol)) {
      const updatedWatchlist = [...watchlist, stock];
      setWatchlist(updatedWatchlist);
      localStorage.setItem('watchlist', JSON.stringify(updatedWatchlist));
      toast.success(`${stock.symbol} added to watchlist`);
    } else {
      toast.info(`${stock.symbol} is already in your watchlist`);
    }
  };

  const handleRemoveFromWatchlist = (symbol: string) => {
    const updatedWatchlist = watchlist.filter(item => item.symbol !== symbol);
    setWatchlist(updatedWatchlist);
    localStorage.setItem('watchlist', JSON.stringify(updatedWatchlist));
    toast.success(`${symbol} removed from watchlist`);
  };

  const toggleFavorite = (symbol: string) => {
    const updatedFavorites = new Set(favoriteStocks);
    
    if (updatedFavorites.has(symbol)) {
      updatedFavorites.delete(symbol);
      toast.info(`${symbol} removed from favorites`);
    } else {
      updatedFavorites.add(symbol);
      toast.success(`${symbol} added to favorites`);
    }
    
    setFavoriteStocks(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify([...updatedFavorites]));
  };

  const handleAddCustomSymbol = () => {
    if (!newSymbol) return;
    
    const symbol = newSymbol.toUpperCase();
    const exchange = selectedMarket === "INDIA" ? "NSE" : "NASDAQ";
    
    if (!watchlist.some(item => item.symbol === symbol)) {
      const newStock: WatchlistItem = {
        symbol,
        name: symbol, // We don't have the full name, so just use the symbol
        exchange
      };
      
      const updatedWatchlist = [...watchlist, newStock];
      setWatchlist(updatedWatchlist);
      localStorage.setItem('watchlist', JSON.stringify(updatedWatchlist));
      toast.success(`${symbol} added to watchlist`);
      setNewSymbol("");
    } else {
      toast.info(`${symbol} is already in your watchlist`);
    }
  };

  const popularStocks = selectedMarket === "INDIA" ? INDIAN_POPULAR_STOCKS : US_POPULAR_STOCKS;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Watchlist</span>
          <div className="flex gap-2">
            <Button 
              variant={selectedMarket === "US" ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedMarket("US")}
            >
              US
            </Button>
            <Button 
              variant={selectedMarket === "INDIA" ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedMarket("INDIA")}
            >
              India
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add custom symbol */}
          <div className="flex gap-2">
            <Input 
              placeholder="Enter stock symbol" 
              value={newSymbol} 
              onChange={(e) => setNewSymbol(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSymbol()}
            />
            <Button onClick={handleAddCustomSymbol}>Add</Button>
          </div>
          
          {/* Current watchlist */}
          {watchlist.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Your Watchlist</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {watchlist.map(stock => (
                  <div 
                    key={stock.symbol} 
                    className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => onSelectStock(stock.symbol)}
                  >
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost" 
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation(); 
                          toggleFavorite(stock.symbol);
                        }}
                      >
                        {favoriteStocks.has(stock.symbol) ? 
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> : 
                          <StarOff className="h-4 w-4" />
                        }
                      </Button>
                      <div>
                        <div className="font-medium">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground">{stock.exchange} - {stock.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromWatchlist(stock.symbol);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Popular stocks */}
          <div>
            <h3 className="font-medium mb-2">Popular {selectedMarket === "INDIA" ? "Indian" : "US"} Stocks</h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {popularStocks.map(stock => (
                <div 
                  key={stock.symbol}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => onSelectStock(stock.symbol)}
                >
                  <div>
                    <div className="font-medium">{stock.symbol}</div>
                    <div className="text-xs text-muted-foreground">{stock.name}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToWatchlist(stock);
                    }}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Watchlist;
