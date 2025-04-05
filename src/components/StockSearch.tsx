
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, IndianRupee } from "lucide-react";
import { toast } from "sonner";

interface StockSearchProps {
  onSearch: (symbol: string) => void;
  isLoading: boolean;
}

const popularStocks = [
  // US stocks
  { name: "Apple", symbol: "AAPL" },
  { name: "Microsoft", symbol: "MSFT" }, 
  { name: "Amazon", symbol: "AMZN" },
  { name: "Tesla", symbol: "TSLA" },
  { name: "Google", symbol: "GOOGL" },
  // Indian stocks - ensure all have proper exchange suffixes
  { name: "Reliance Industries", symbol: "RELIANCE.NS", indian: true },
  { name: "Tata Consultancy", symbol: "TCS.NS", indian: true },
  { name: "HDFC Bank", symbol: "HDFCBANK.NS", indian: true },
  { name: "Infosys", symbol: "INFY.NS", indian: true },
  { name: "ICICI Bank", symbol: "ICICIBANK.NS", indian: true },
];

const StockSearch: React.FC<StockSearchProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a stock symbol or company name");
      return;
    }
    
    // Format Indian stock symbols automatically if needed
    let searchSymbol = query.trim().toUpperCase();
    
    // Check if it's likely an Indian stock but missing the exchange suffix
    const isLikelyIndianStock = /^[A-Za-z&]+$/.test(searchSymbol) && 
                               !searchSymbol.includes('.') && 
                               (searchSymbol.length >= 2) &&
                               !["AAPL", "MSFT", "AMZN", "TSLA", "GOOGL", "FB", "NFLX"].includes(searchSymbol);
    
    // Try to match from our popularStocks list first
    const matchedStock = popularStocks.find(
      stock => stock.symbol.split('.')[0].toUpperCase() === searchSymbol || 
              stock.symbol.toUpperCase() === searchSymbol
    );
    
    if (matchedStock) {
      // If found in our list, use the full symbol with exchange
      searchSymbol = matchedStock.symbol;
      setQuery(matchedStock.symbol);
      
      if (matchedStock.indian) {
        toast.info(`Searching Indian stock: ${matchedStock.name}`);
      }
    } else if (isLikelyIndianStock) {
      // If likely an Indian stock but not in our list, add .NS suffix as default
      searchSymbol = `${searchSymbol}.NS`;
      toast.info(`Searching as Indian stock: ${searchSymbol}`);
    }
    
    onSearch(searchSymbol);
  };

  const handleQuickSearch = (symbol: string) => {
    setQuery(symbol);
    onSearch(symbol);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="Enter stock symbol (e.g., AAPL, RELIANCE.NS)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Search
        </Button>
      </form>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-sm font-medium text-muted-foreground mr-2">Popular:</span>
        {popularStocks.map((stock) => (
          <Button
            key={stock.symbol}
            variant="outline"
            size="sm"
            onClick={() => handleQuickSearch(stock.symbol)}
            className="text-xs flex items-center"
          >
            {stock.indian && <IndianRupee className="h-3 w-3 mr-1" />}
            {stock.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default StockSearch;
