
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import Header from "@/components/Header";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-muted rounded-full">
              <BarChart3 className="h-16 w-16 text-muted-foreground" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold text-finance-dark-blue mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Oops! The stock analysis you're looking for can't be found.
          </p>
          
          <Button size="lg" asChild>
            <a href="/">Return to Dashboard</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
