
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface StockSearchProps {
  onSearch: (symbol: string) => void;
  isLoading: boolean;
}

const popularStocks = [
  { name: "Apple", symbol: "AAPL" },
  { name: "Microsoft", symbol: "MSFT" }, 
  { name: "Amazon", symbol: "AMZN" },
  { name: "Tesla", symbol: "TSLA" },
  { name: "Google", symbol: "GOOGL" },
];

const StockSearch: React.FC<StockSearchProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a stock symbol or company name");
      return;
    }
    onSearch(query);
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
          placeholder="Enter stock symbol (e.g., AAPL, MSFT)"
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
            className="text-xs"
          >
            {stock.name} ({stock.symbol})
          </Button>
        ))}
      </div>
    </div>
  );
};

export default StockSearch;
