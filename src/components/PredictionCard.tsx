
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Prediction } from '@/lib/types';

interface PredictionCardProps {
  prediction: Prediction;
  currentPrice: number;
}

const PredictionCard: React.FC<PredictionCardProps> = ({ prediction, currentPrice }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };
  
  const calculateChange = (price: number) => {
    return ((price - currentPrice) / currentPrice) * 100;
  };
  
  const predictedChange = calculateChange(prediction.predictedPrice);
  const isPositive = predictedChange > 0;
  
  // Normalize confidence to a value between 0-100 for the progress bar
  const confidenceScore = prediction.confidence * 100;

  // Determine recommendation color and icon
  const getRecommendationDisplay = () => {
    switch (prediction.recommendation) {
      case 'Strong Buy':
        return { color: 'text-green-600', bgColor: 'bg-green-50', icon: <TrendingUp className="h-5 w-5 text-green-600" /> };
      case 'Buy':
        return { color: 'text-green-500', bgColor: 'bg-green-50', icon: <TrendingUp className="h-5 w-5 text-green-500" /> };
      case 'Hold':
        return { color: 'text-amber-500', bgColor: 'bg-amber-50', icon: <AlertCircle className="h-5 w-5 text-amber-500" /> };
      case 'Sell':
        return { color: 'text-red-500', bgColor: 'bg-red-50', icon: <TrendingDown className="h-5 w-5 text-red-500" /> };
      case 'Strong Sell':
        return { color: 'text-red-600', bgColor: 'bg-red-50', icon: <TrendingDown className="h-5 w-5 text-red-600" /> };
      default:
        return { color: 'text-gray-500', bgColor: 'bg-gray-50', icon: <AlertCircle className="h-5 w-5 text-gray-500" /> };
    }
  };
  
  const recommendationDisplay = getRecommendationDisplay();
  
  return (
    <Card className="shadow-md w-full">
      <CardHeader>
        <CardTitle className="text-xl">Price Prediction ({prediction.timeframe})</CardTitle>
        <CardDescription>Based on historical data and market trends</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Current Price</h3>
              <p className="text-lg font-semibold">{formatPrice(currentPrice)}</p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-medium text-muted-foreground">Predicted Price</h3>
              <p className={`text-lg font-semibold ${isPositive ? 'text-finance-green' : 'text-finance-red'}`}>
                {formatPrice(prediction.predictedPrice)}
              </p>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Predicted Change</span>
              <span className={`text-sm font-medium ${isPositive ? 'text-finance-green' : 'text-finance-red'}`}>
                {isPositive ? '+' : ''}{predictedChange.toFixed(2)}%
              </span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${isPositive ? 'bg-finance-green' : 'bg-finance-red'}`}
                style={{ width: `${Math.min(Math.abs(predictedChange) * 2, 100)}%` }} 
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Prediction Confidence</span>
              <span className="text-sm font-medium">{confidenceScore.toFixed(0)}%</span>
            </div>
            <Progress value={confidenceScore} className="h-2" />
          </div>
          
          <div className="pt-4 mt-4 border-t">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-full ${recommendationDisplay.bgColor}`}>
                {recommendationDisplay.icon}
              </div>
              <div>
                <h3 className="text-sm font-medium">Recommendation</h3>
                <p className={`text-lg font-semibold ${recommendationDisplay.color}`}>
                  {prediction.recommendation}
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {prediction.reasoning}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictionCard;
