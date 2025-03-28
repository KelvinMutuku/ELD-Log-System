
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md w-full glass-panel rounded-lg p-8">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <MapPin className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-display font-bold mb-3">404</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Oops! The route you're looking for can't be found
        </p>
        <Button asChild className="w-full">
          <a href="/">Return to Home</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
