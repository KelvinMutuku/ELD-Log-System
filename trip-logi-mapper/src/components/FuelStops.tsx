
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteStop } from '@/utils/routeUtils';
import { Droplet, Clock } from 'lucide-react';

interface FuelStopsProps {
  fuelStops: RouteStop[];
}

const FuelStops: React.FC<FuelStopsProps> = ({ fuelStops }) => {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };
  
  if (!fuelStops || fuelStops.length === 0) {
    return (
      <Card className="w-full glass-panel">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Droplet className="h-4 w-4 text-blue-500" />
            <span>Fuel Stops</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <Droplet className="h-8 w-8 text-muted mb-2" />
            <p className="text-muted-foreground">No fuel stops scheduled for this trip.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full glass-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Droplet className="h-4 w-4 text-blue-500" />
          <span>Fuel Stops</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fuelStops.map((stop, index) => (
            <div 
              key={index} 
              className="relative pl-6 pb-4 last:pb-0 last:before:hidden before:absolute before:left-2 before:top-0 before:h-full before:w-px before:bg-border"
            >
              <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Fuel Stop {index + 1}</div>
                <div className="text-xs text-muted-foreground">
                  {stop.location.description || 
                   `Location: ${stop.location.lat.toFixed(5)}, ${stop.location.lng.toFixed(5)}`}
                </div>
                <div className="flex items-center text-xs text-muted-foreground gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Arrival: {formatTime(stop.arrivalTime)}</span>
                </div>
                <div className="text-xs text-muted-foreground ml-4">
                  Duration: {stop.duration} minutes
                </div>
                <div className="text-xs text-muted-foreground ml-4">
                  Departure: {formatTime(stop.departureTime)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FuelStops;
