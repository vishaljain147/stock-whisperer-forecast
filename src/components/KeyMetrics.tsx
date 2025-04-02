
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Metrics } from '@/lib/types';

interface KeyMetricsProps {
  metrics: Metrics;
}

const KeyMetrics: React.FC<KeyMetricsProps> = ({ metrics }) => {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">Key Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <MetricItem 
            label="Market Cap" 
            value={formatLargeNumber(metrics.marketCap)} 
          />
          <MetricItem 
            label="P/E Ratio" 
            value={metrics.peRatio.toFixed(2)} 
          />
          <MetricItem 
            label="Dividend Yield" 
            value={`${metrics.dividendYield.toFixed(2)}%`} 
          />
          <MetricItem 
            label="52W High" 
            value={`$${metrics.high52Week.toFixed(2)}`} 
          />
          <MetricItem 
            label="52W Low" 
            value={`$${metrics.low52Week.toFixed(2)}`} 
          />
          <MetricItem 
            label="Volume" 
            value={formatLargeNumber(metrics.volume)} 
          />
        </div>
      </CardContent>
    </Card>
  );
};

const MetricItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-lg font-medium">{value}</span>
  </div>
);

function formatLargeNumber(num: number): string {
  if (num >= 1000000000) {
    return `$${(num / 1000000000).toFixed(2)}B`;
  } else if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
}

export default KeyMetrics;
