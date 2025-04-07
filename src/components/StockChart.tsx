import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Area, AreaChart, Legend, BarChart, Bar,
  ReferenceLine, ComposedChart, Scatter
} from 'recharts';
import { StockData, isIndianExchange, getCurrencySymbol, formatCurrency } from '@/lib/types';
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { Switch } from "@/components/ui/switch";
import { 
  ChartLine, 
  BarChart3,
  LineChart as LineChartIcon,
  CircleAlert,
  TrendingUp,
  IndianRupee,
  Calendar,
  ChartCandlestick
} from "lucide-react";

interface StockChartProps {
  data: StockData[];
  stockSymbol: string;
  companyName: string;
  exchange?: string;
}

const StockChart: React.FC<StockChartProps> = ({ 
  data, 
  stockSymbol, 
  companyName,
  exchange = "NASDAQ" 
}) => {
  const [timeRange, setTimeRange] = useState<"all" | "1d" | "1m" | "3m" | "6m" | "1y">("all");
  const [chartType, setChartType] = useState<"area" | "candlestick" | "bar" | "line">("area");
  const [showVolume, setShowVolume] = useState<boolean>(false);

  // Determine if it's an Indian stock for currency display
  const isIndian = isIndianExchange(exchange) || stockSymbol.includes('.NS') || stockSymbol.includes('.BSE');
  
  const filterDataByRange = () => {
    if (!data?.length) return [];
    
    // If "all" is selected, return all data
    if (timeRange === "all") return data;
    
    const now = new Date();
    let pastDate = new Date();
    
    switch (timeRange) {
      case "1d":
        // Set to 24 hours ago
        pastDate.setDate(now.getDate() - 1);
        break;
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
  
  // Map the data for display, adding index property used by candlestick
  const processedData = filteredData.map((item, index) => {
    return {
      ...item,
      index,
    };
  });
  
  const currentPrice = data[data.length - 1]?.close || 0;
  const previousPrice = data[data.length - 2]?.close || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;
  
  const formatPrice = (price: number) => {
    return formatCurrency(price, exchange);
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
  const currencySymbol = getCurrencySymbol(exchange);
  
  const CandlestickTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-md p-2 shadow-md">
          <p className="font-medium">{formatDate(data.date)}</p>
          <p className="text-sm">Open: {formatPrice(data.open)}</p>
          <p className="text-sm">High: {formatPrice(data.high)}</p>
          <p className="text-sm">Low: {formatPrice(data.low)}</p>
          <p className="text-sm">Close: {formatPrice(data.close)}</p>
          <p className="text-sm">Volume: {data.volume.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  // Improved candlestick implementation
  const renderCandlestick = () => {
    // If we have very few data points, candlestick doesn't render well
    if (processedData.length < 5) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <p>Not enough data for candlestick chart. Try another chart type.</p>
        </div>
      );
    }

    // Calculate reasonable width for each candlestick based on data points
    const candleWidth = Math.min(8, Math.max(2, 300 / processedData.length));
    
    return (
      <ResponsiveContainer width="100%" height={showVolume ? "70%" : "100%"}>
        <ComposedChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
            tickMargin={10}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${currencySymbol}${value}`}
            domain={['auto', 'auto']}
            tickMargin={10}
          />
          <ChartTooltip content={<CandlestickTooltip />} />
          
          {/* Render candles one by one */}
          {processedData.map((entry, index) => {
            const isRising = entry.close >= entry.open;
            const wickColor = isRising ? '#2CA58D' : '#E63946';
            const bodyColor = isRising ? '#2CA58D' : '#E63946';
            
            // Rendering wick (high to low)
            return [
              // High to Low line (the wick)
              <ReferenceLine
                key={`wick-${index}`}
                segment={[
                  { x: entry.date, y: entry.low },
                  { x: entry.date, y: entry.high }
                ]}
                stroke={wickColor}
                strokeWidth={1}
              />,
              // Open to Close rectangle (the candle body)
              <ReferenceLine
                key={`body-${index}`}
                segment={[
                  { x: entry.date, y: entry.open },
                  { x: entry.date, y: entry.close }
                ]}
                stroke={bodyColor}
                strokeWidth={candleWidth}
              />
            ];
          }).flat()}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  const renderAreaChart = () => {
    return (
      <ResponsiveContainer width="100%" height={showVolume ? "70%" : "100%"}>
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
            tickFormatter={(value) => `${isIndian ? '₹' : '$'}${value}`}
            domain={['auto', 'auto']}
            tickMargin={10}
          />
          <ChartTooltip 
            formatter={(value) => [formatPrice(value as number), 'Price']}
            labelFormatter={(label) => formatDate(label as string)}
            content={({active, payload, label}) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background border rounded-md p-2 shadow-md">
                    <p className="font-medium">{formatDate(label as string)}</p>
                    <p className="text-sm">Price: {formatPrice(payload[0].value as number)}</p>
                  </div>
                );
              }
              return null;
            }}
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
    );
  };

  const renderLineChart = () => {
    return (
      <ResponsiveContainer width="100%" height={showVolume ? "70%" : "100%"}>
        <LineChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
            tickMargin={10}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${isIndian ? '₹' : '$'}${value}`}
            domain={['auto', 'auto']}
            tickMargin={10}
          />
          <ChartTooltip 
            formatter={(value) => [formatPrice(value as number), 'Price']}
            labelFormatter={(label) => formatDate(label as string)}
          />
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke={chartColor} 
            dot={false}
            activeDot={{ r: 4 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };
  
  const renderBarChart = () => {
    return (
      <ResponsiveContainer width="100%" height={showVolume ? "70%" : "100%"}>
        <BarChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
            tickMargin={10}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${isIndian ? '₹' : '$'}${value}`}
            domain={['auto', 'auto']}
            tickMargin={10}
          />
          <ChartTooltip 
            formatter={(value) => [formatPrice(value as number), 'Price']}
            labelFormatter={(label) => formatDate(label as string)}
          />
          <Bar 
            dataKey="close" 
            fill={chartColor}
            animationDuration={1000}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderVolumeChart = () => {
    if (!showVolume) return null;
    
    return (
      <ResponsiveContainer width="100%" height="25%">
        <BarChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            tick={{ fontSize: 10 }}
            height={20}
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
            domain={['auto', 'auto']}
          />
          <ChartTooltip 
            formatter={(value) => [`${value.toLocaleString()}`, 'Volume']}
            labelFormatter={(label) => formatDate(label as string)}
          />
          <Bar 
            dataKey="volume" 
            fill="#6c757d"
            animationDuration={1000}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">{stockSymbol}</CardTitle>
          <p className="text-muted-foreground">{companyName} - {exchange}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold animate-number flex items-center">
            {isIndian && <IndianRupee className="mr-1 h-6 w-6" />}
            {!isIndian && "$"}
            {currentPrice.toFixed(2)}
          </p>
          <p className={`flex items-center ${priceColor}`}>
            {isPositive ? '▲' : '▼'} {currencySymbol}{Math.abs(priceChange).toFixed(2)} ({priceChangePercent.toFixed(2)}%)
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <Tabs defaultValue="all" className="w-auto" onValueChange={(value) => setTimeRange(value as any)}>
            <TabsList>
              <TabsTrigger value="all" className="flex items-center gap-1">
                <Calendar size={15} /> All
              </TabsTrigger>
              <TabsTrigger value="1d">1D</TabsTrigger>
              <TabsTrigger value="1m">1M</TabsTrigger>
              <TabsTrigger value="3m">3M</TabsTrigger>
              <TabsTrigger value="6m">6M</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Tabs defaultValue="area" className="w-auto" onValueChange={(value) => setChartType(value as any)}>
            <TabsList>
              <TabsTrigger value="area" className="flex items-center gap-1">
                <ChartLine size={15} /> Area
              </TabsTrigger>
              <TabsTrigger value="candlestick" className="flex items-center gap-1">
                <ChartCandlestick size={15} /> Candlestick
              </TabsTrigger>
              <TabsTrigger value="line" className="flex items-center gap-1">
                <LineChartIcon size={15} /> Line
              </TabsTrigger>
              <TabsTrigger value="bar" className="flex items-center gap-1">
                <BarChart3 size={15} /> Bar
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Volume</span>
            <Switch checked={showVolume} onCheckedChange={setShowVolume} />
          </div>
        </div>
        
        <div className="chart-container h-[300px] animate-chart-animation relative">
          {filteredData.length > 0 ? (
            <>
              {chartType === "area" && renderAreaChart()}
              {chartType === "candlestick" && renderCandlestick()}
              {chartType === "line" && renderLineChart()}
              {chartType === "bar" && renderBarChart()}
              {showVolume && renderVolumeChart()}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <CircleAlert size={32} />
                <p>No data available for the selected timeframe</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StockChart;
