
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Area, AreaChart, Legend
} from 'recharts';
import { StockData } from '@/lib/types';

interface StockChartProps {
  data: StockData[];
  stockSymbol: string;
  companyName: string;
}

const StockChart: React.FC<StockChartProps> = ({ data, stockSymbol, companyName }) => {
  const [timeRange, setTimeRange] = useState<"1m" | "3m" | "6m" | "1y">("1m");
  
  const filterDataByRange = () => {
    if (!data?.length) return [];
    
    const now = new Date();
    let pastDate = new Date();
    
    switch (timeRange) {
      case "1m":
        pastDate.setMonth(now.getMonth() - 1);
        break;
      case "3m":
        pastDate.setMonth(now.getMonth() - 3);
        break;
      case "6m":
        pastDate.setMonth(now.getMonth() - 6);
        break;
      case "1y":
        pastDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= pastDate && itemDate <= now;
    });
  };

  const filteredData = filterDataByRange();
  
  const currentPrice = data[data.length - 1]?.close || 0;
  const previousPrice = data[data.length - 2]?.close || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = (priceChange / previousPrice) * 100;
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric'
    });
  };

  const isPositive = priceChange >= 0;
  const priceColor = isPositive ? 'text-finance-green' : 'text-finance-red';
  const chartColor = isPositive ? '#2CA58D' : '#E63946';

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">{stockSymbol}</CardTitle>
          <p className="text-muted-foreground">{companyName}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold animate-number">{formatPrice(currentPrice)}</p>
          <p className={`flex items-center ${priceColor}`}>
            {isPositive ? '▲' : '▼'} {formatPrice(Math.abs(priceChange))} ({priceChangePercent.toFixed(2)}%)
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="1m" className="w-full" onValueChange={(value) => setTimeRange(value as any)}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="1m">1M</TabsTrigger>
              <TabsTrigger value="3m">3M</TabsTrigger>
              <TabsTrigger value="6m">6M</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value={timeRange} className="chart-container h-[300px] animate-chart-animation">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                  domain={['auto', 'auto']}
                  tickMargin={10}
                />
                <Tooltip 
                  formatter={(value) => [formatPrice(value as number), 'Price']}
                  labelFormatter={(label) => formatDate(label as string)}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  stroke={chartColor} 
                  fill="url(#colorPrice)"
                  animationDuration={1000}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StockChart;
