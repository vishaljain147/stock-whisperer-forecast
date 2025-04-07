
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { 
  ChartLine, 
  BarChart3,
  LineChart as LineChartIcon,
  CircleAlert,
  TrendingUp,
  IndianRupee,
  Calendar,
  Clock,
  Activity,
  ChartArea,
  RefreshCw,
  WifiOff
} from "lucide-react";
import { toast } from 'sonner';

interface StockChartProps {
  data: StockData[];
  stockSymbol: string;
  companyName: string;
  exchange?: string;
  onRefreshData?: () => Promise<void>;
}

const StockChart: React.FC<StockChartProps> = ({ 
  data, 
  stockSymbol, 
  companyName,
  exchange = "NASDAQ",
  onRefreshData
}) => {
  const [timeRange, setTimeRange] = useState<"all" | "1d" | "1h" | "1m" | "3m" | "6m" | "1y">("1d");
  const [chartType, setChartType] = useState<"area" | "candlestick" | "bar" | "line">("area");
  const [showVolume, setShowVolume] = useState<boolean>(false);
  const [isLiveUpdate, setIsLiveUpdate] = useState<boolean>(false);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline" | "weak">("online");
  const liveUpdateIntervalRef = useRef<number | null>(null);
  const connectionCheckIntervalRef = useRef<number | null>(null);

  // Determine if it's an Indian stock for currency display
  const isIndian = isIndianExchange(exchange) || stockSymbol.includes('.NS') || stockSymbol.includes('.BSE');

  // Check internet connection status
  useEffect(() => {
    const checkConnection = () => {
      if (!navigator.onLine) {
        setConnectionStatus("offline");
        return;
      }
      
      // Check connection strength by timing a simple fetch
      const startTime = Date.now();
      fetch('https://www.alphavantage.co', { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store'
      })
        .then(() => {
          const latency = Date.now() - startTime;
          if (latency > 1000) {
            setConnectionStatus("weak");
          } else {
            setConnectionStatus("online");
          }
        })
        .catch(() => {
          setConnectionStatus("offline");
        });
    };

    // Initial check
    checkConnection();
    
    // Setup periodic check
    connectionCheckIntervalRef.current = window.setInterval(checkConnection, 60000) as unknown as number;
    
    // Setup event listeners
    window.addEventListener('online', () => setConnectionStatus("online"));
    window.addEventListener('offline', () => setConnectionStatus("offline"));
    
    return () => {
      window.removeEventListener('online', () => setConnectionStatus("online"));
      window.removeEventListener('offline', () => setConnectionStatus("offline"));
      if (connectionCheckIntervalRef.current !== null) {
        clearInterval(connectionCheckIntervalRef.current);
      }
    };
  }, []);

  // Check if market is currently open
  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const day = now.getDay();
      
      // Weekends (0 = Sunday, 6 = Saturday)
      if (day === 0 || day === 6) {
        setIsMarketOpen(false);
        return;
      }
      
      // For Indian markets (NSE/BSE) - 9:15 AM to 3:30 PM IST
      if (isIndian) {
        // Convert to IST (UTC+5:30) roughly
        const istHour = (hour + 5) % 24;
        const istMinute = (minute + 30) % 60;
        const isOpen = (istHour > 9 || (istHour === 9 && istMinute >= 15)) && 
                      (istHour < 15 || (istHour === 15 && istMinute <= 30));
        setIsMarketOpen(isOpen);
        return;
      }
      
      // For US markets - 9:30 AM to 4:00 PM EST
      // This is a simplification - a real app would handle timezones better
      const isOpen = (hour >= 9 && minute >= 30 || hour > 9) && hour < 16;
      setIsMarketOpen(isOpen);
    };
    
    checkMarketStatus();
    
    // Check market status every minute
    const intervalId = setInterval(checkMarketStatus, 60000);
    
    return () => clearInterval(intervalId);
  }, [isIndian]);
  
  // Refresh data at regular intervals if live updates are enabled and market is open
  useEffect(() => {
    // Clear any existing interval when dependencies change
    if (liveUpdateIntervalRef.current !== null) {
      clearInterval(liveUpdateIntervalRef.current);
      liveUpdateIntervalRef.current = null;
    }
    
    if (!isLiveUpdate || !isMarketOpen || !onRefreshData || connectionStatus === "offline") {
      return;
    }
    
    // Set update interval based on connection quality
    const updateInterval = connectionStatus === "weak" ? 120000 : 60000; // 2 min for weak, 1 min for good connection
    
    liveUpdateIntervalRef.current = window.setInterval(async () => {
      try {
        setIsUpdating(true);
        await onRefreshData();
        setLastUpdated(new Date());
        toast.success(`Data updated for ${stockSymbol}`, {
          duration: 2000,
        });
      } catch (error) {
        console.error('Error refreshing data:', error);
        toast.error('Failed to update data. Will retry.');
      } finally {
        setIsUpdating(false);
      }
    }, updateInterval) as unknown as number;
    
    return () => {
      if (liveUpdateIntervalRef.current !== null) {
        clearInterval(liveUpdateIntervalRef.current);
      }
    };
  }, [isLiveUpdate, isMarketOpen, onRefreshData, connectionStatus, stockSymbol]);
  
  const filterDataByRange = useCallback(() => {
    if (!data?.length) return [];
    
    // If "all" is selected, return all data
    if (timeRange === "all") return data;
    
    const now = new Date();
    let pastDate = new Date();
    
    switch (timeRange) {
      case "1h":
        // Set to 1 hour ago (uses most recent data points, might not be exactly hourly)
        pastDate.setHours(now.getHours() - 1);
        // For 1h, we'll take the last 12 data points to approximate hourly view
        return data.slice(-12);
      case "1d":
        // Set to 24 hours ago
        pastDate.setDate(now.getDate() - 1);
        return data.slice(-24); // Take last 24 points for better intraday view
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
  }, [data, timeRange]);

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
    if (timeRange === "1h" || timeRange === "1d") {
      // For shorter timeframes, show time
      return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric'
    });
  };

  const isPositive = priceChange >= 0;
  const priceColor = isPositive ? 'text-finance-green' : 'text-finance-red';
  const chartColor = isPositive ? '#2CA58D' : '#E63946';
  const currencySymbol = getCurrencySymbol(exchange);

  // Handle toggle of live updates
  const handleLiveUpdateToggle = (checked: boolean) => {
    setIsLiveUpdate(checked);
    if (checked && isMarketOpen && onRefreshData) {
      // Immediate update when toggling on
      handleManualRefresh();
    }
  };
  
  // Handle manual refresh
  const handleManualRefresh = async () => {
    if (!onRefreshData || isUpdating) return;
    
    try {
      setIsUpdating(true);
      await onRefreshData();
      setLastUpdated(new Date());
      toast.success(`Data updated for ${stockSymbol}`, {
        duration: 2000,
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to update data');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Candlestick tooltip component
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
            tickFormatter={(value) => `${currencySymbol}${value}`}
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
            tickFormatter={(value) => `${currencySymbol}${value}`}
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
            tickFormatter={(value) => `${currencySymbol}${value}`}
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

  const formatLastUpdated = () => {
    return lastUpdated.toLocaleTimeString();
  };
  
  // Get connection status details
  const getConnectionStatusDetails = () => {
    switch (connectionStatus) {
      case 'online':
        return {
          icon: <RefreshCw size={14} className="mr-1" />,
          label: 'Connected',
          className: 'bg-green-500 hover:bg-green-500'
        };
      case 'weak':
        return {
          icon: <RefreshCw size={14} className="mr-1 animate-pulse" />,
          label: 'Weak Connection',
          className: 'bg-amber-500 hover:bg-amber-500'
        };
      case 'offline':
        return {
          icon: <WifiOff size={14} className="mr-1" />,
          label: 'Offline',
          className: 'bg-destructive hover:bg-destructive'
        };
    }
  };
  
  const connectionDetails = getConnectionStatusDetails();

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
          <Tabs defaultValue="1d" value={timeRange} className="w-auto" onValueChange={(value) => setTimeRange(value as any)}>
            <TabsList>
              <TabsTrigger value="1h" className="flex items-center gap-1">1H</TabsTrigger>
              <TabsTrigger value="1d">1D</TabsTrigger>
              <TabsTrigger value="1m">1M</TabsTrigger>
              <TabsTrigger value="3m">3M</TabsTrigger>
              <TabsTrigger value="6m">6M</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-1">
                <Calendar size={15} /> All
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Tabs defaultValue="area" value={chartType} className="w-auto" onValueChange={(value) => setChartType(value as any)}>
            <TabsList>
              <TabsTrigger value="area" className="flex items-center gap-1">
                <ChartArea size={15} /> Area
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
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Volume</span>
              <Switch checked={showVolume} onCheckedChange={setShowVolume} />
            </div>
            
            {onRefreshData && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Live Updates</span>
                <Switch 
                  checked={isLiveUpdate} 
                  onCheckedChange={handleLiveUpdateToggle}
                  disabled={!isMarketOpen || connectionStatus === "offline"}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Connection and Market Status Section */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge 
              variant={isMarketOpen ? "default" : "outline"} 
              className={isMarketOpen ? "bg-finance-green hover:bg-finance-green" : ""}
            >
              <Clock size={14} className="mr-1" /> 
              {isMarketOpen ? 'Market Open' : 'Market Closed'}
            </Badge>
            
            <Badge variant={connectionStatus === "online" ? "default" : "outline"} className={connectionDetails.className}>
              {connectionDetails.icon} {connectionDetails.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {isLiveUpdate && isMarketOpen && (
              <Badge variant="outline" className="animate-pulse">
                <Activity size={14} className="mr-1" /> Live • Updated at {formatLastUpdated()}
              </Badge>
            )}
            
            {onRefreshData && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleManualRefresh}
                disabled={isUpdating || connectionStatus === "offline"}
                className="flex items-center gap-1"
              >
                <RefreshCw size={14} className={isUpdating ? "animate-spin" : ""} />
                {isUpdating ? 'Updating...' : 'Refresh'}
              </Button>
            )}
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
