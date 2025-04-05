import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Area, AreaChart, Legend, BarChart, Bar,
  ReferenceLine, ComposedChart, Scatter
} from 'recharts';
import { StockData } from '@/lib/types';
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
  TrendingUp
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
  const [timeRange, setTimeRange] = useState<"1m" | "3m" | "6m" | "1y">("1m");
  const [chartType, setChartType] = useState<"area" | "candlestick" | "bar" | "line">("area");
  const [showVolume, setShowVolume] = useState<boolean>(false);
  
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
  
  const processedData = filteredData.map((item, index) => {
    return {
      ...item,
      index: index,
    };
  });
  
  const currentPrice = data[data.length - 1]?.close || 0;
  const previousPrice = data[data.length - 2]?.close || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = (priceChange / previousPrice) * 100;
  
  const formatPrice = (price: number) => {
    const currency = isIndianExchange(exchange) ? 'INR' : 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
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

  const isIndianExchange = (exchange: string) => {
    const indianExchanges = ["NSE", "BSE"];
    return indianExchanges.includes(exchange);
  };
  
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

  const renderCandlestick = () => {
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
            tickFormatter={(value) => `${isIndianExchange(exchange) ? '₹' : '$'}${value}`}
            domain={['auto', 'auto']}
            tickMargin={10}
          />
          <ChartTooltip content={<CandlestickTooltip />} />
          
          {processedData.map((entry, index) => {
            const isRising = entry.close >= entry.open;
            return [
              <ReferenceLine
                key={`hl-${index}`}
                segment={[
                  { x: index, y: entry.low },
                  { x: index, y: entry.high }
                ]}
                stroke={isRising ? '#2CA58D' : '#E63946'}
                strokeWidth={1}
                ifOverflow="extendDomain"
              />,
              <ReferenceLine
                key={`oc-${index}`}
                segment={[
                  { x: index, y: entry.open },
                  { x: index, y: entry.close }
                ]}
                stroke={isRising ? '#2CA58D' : '#E63946'}
                strokeWidth={6}
                ifOverflow="extendDomain"
              />
            ];
          }).flat()}
          
          <Bar dataKey="high" fill="transparent" stroke="transparent" />
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
            tickFormatter={(value) => `${isIndianExchange(exchange) ? '₹' : '$'}${value}`}
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
            tickFormatter={(value) => `${isIndianExchange(exchange) ? '₹' : '$'}${value}`}
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
            tickFormatter={(value) => `${isIndianExchange(exchange) ? '₹' : '$'}${value}`}
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
          <p className="text-3xl font-bold animate-number">{formatPrice(currentPrice)}</p>
          <p className={`flex items-center ${priceColor}`}>
            {isPositive ? '▲' : '▼'} {formatPrice(Math.abs(priceChange))} ({priceChangePercent.toFixed(2)}%)
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <Tabs defaultValue="1m" className="w-auto" onValueChange={(value) => setTimeRange(value as any)}>
            <TabsList>
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
                <TrendingUp size={15} /> Candlestick
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
          {chartType === "area" && renderAreaChart()}
          {chartType === "candlestick" && renderCandlestick()}
          {chartType === "line" && renderLineChart()}
          {chartType === "bar" && renderBarChart()}
          {showVolume && renderVolumeChart()}
          
          {filteredData.length === 0 && (
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
