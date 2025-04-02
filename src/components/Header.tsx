
import React from 'react';
import { BarChart3 } from "lucide-react";

const Header: React.FC = () => {
  return (
    <header className="border-b">
      <div className="container py-4 flex items-center">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-finance-teal" />
          <h1 className="text-xl font-bold">StockWhisperer</h1>
        </div>
        <p className="ml-4 text-muted-foreground">
          Real-Time Stock Market Price Analyzer
        </p>
      </div>
    </header>
  );
};

export default Header;
