
import React from 'react';
import { ArrowRight, Map, Route, TruckIcon } from 'lucide-react';

const Header = () => {
  return (
    <header className="w-full py-6 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <TruckIcon className="h-8 w-8 text-primary mr-2 animate-float" />
            <div className="flex flex-col">
              <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
                TripLogiMapper
              </h1>
              <p className="text-sm text-muted-foreground">
                Route Planner & ELD Logger
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Map className="h-4 w-4" />
            <span>Route Planner</span>
            <ArrowRight className="h-3 w-3" />
            <Route className="h-4 w-4" />
            <span>ELD Logger</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
