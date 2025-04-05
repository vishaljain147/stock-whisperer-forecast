
import React, { ReactNode } from 'react';
import { BarChart3, TrendingUp } from "lucide-react";

interface HeaderProps {
  children?: ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => {
  return (
    <header className="border-b">
      <div className="container py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <BarChart3 className="w-6 h-6 text-finance-teal" />
            <TrendingUp className="w-5 h-5 -ml-1 text-finance-green" />
          </div>
          <h1 className="text-xl font-bold">StockWhisperer</h1>
        </div>
        <p className="ml-4 mr-auto text-muted-foreground">
          Advanced Stock Market Price Analyzer
        </p>
        {children}
      </div>
    </header>
  );
};

export default Header;
