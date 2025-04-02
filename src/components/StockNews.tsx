
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewsItem } from '@/lib/types';

interface StockNewsProps {
  news: NewsItem[];
}

const StockNews: React.FC<StockNewsProps> = ({ news }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">Latest News</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {news.length === 0 ? (
            <p className="text-muted-foreground">No recent news available.</p>
          ) : (
            news.map((item, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group"
                >
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {item.summary}
                  </p>
                  <div className="flex items-center mt-2 text-xs text-muted-foreground">
                    <span>{item.source}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(item.date)}</span>
                  </div>
                </a>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StockNews;
