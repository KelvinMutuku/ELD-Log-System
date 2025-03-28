
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Location } from "@/utils/routeUtils";
import { MapPin, Navigation, AlertTriangle, Loader2 } from 'lucide-react';

interface TripFormProps {
  onPlanTrip: (
    currentLocation: Location,
    pickupLocation: Location,
    dropoffLocation: Location,
    currentCycleUsed: number
  ) => void;
  isLoading?: boolean;
}

const TripForm: React.FC<TripFormProps> = ({ onPlanTrip, isLoading = false }) => {
  const { toast } = useToast();
  
  const [currentLocationInput, setCurrentLocationInput] = useState('');
  const [pickupLocationInput, setPickupLocationInput] = useState('');
  const [dropoffLocationInput, setDropoffLocationInput] = useState('');
  const [currentCycleUsed, setCurrentCycleUsed] = useState('0');
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  
  // Function to handle getting current location
  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocationInput(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setGpsEnabled(true);
          setGpsLoading(false);
          toast({
            title: "Location detected",
            description: "Your current location has been set.",
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setGpsLoading(false);
          toast({
            title: "Location error",
            description: "Could not get your current location. Please enter it manually.",
            variant: "destructive",
          });
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast({
        title: "GPS not available",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      });
    }
  };
  
  // Function to parse location input into lat/lng
  const parseLocation = (input: string): Location | null => {
    // Handle lat,lng format (numbers separated by comma)
    const latLngRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
    const latLngMatch = input.match(latLngRegex);
    
    if (latLngMatch) {
      return {
        lat: parseFloat(latLngMatch[1]),
        lng: parseFloat(latLngMatch[3]),
        description: input
      };
    }
    
    // In a real app, we would use a geocoding API to convert addresses to coordinates
    // For now, we'll use a simplified example that treats the input as a location description
    // and assigns random but plausible coordinates in the US
    const getRandomCoord = () => {
      // Random coordinates roughly in the continental US
      const lat = 37 + (Math.random() - 0.5) * 10;
      const lng = -98 + (Math.random() - 0.5) * 20;
      return { lat, lng };
    };
    
    const coords = getRandomCoord();
    return {
      lat: coords.lat,
      lng: coords.lng,
      description: input
    };
  };
  
  // Function to handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Parse locations
      const currentLocation = parseLocation(currentLocationInput);
      const pickupLocation = parseLocation(pickupLocationInput);
      const dropoffLocation = parseLocation(dropoffLocationInput);
      
      // Validate inputs
      if (!currentLocation || !pickupLocation || !dropoffLocation) {
        toast({
          title: "Invalid locations",
          description: "Please provide valid locations for current position, pickup, and dropoff.",
          variant: "destructive",
        });
        return;
      }
      
      // Parse cycle hours
      const cycleHours = parseFloat(currentCycleUsed);
      if (isNaN(cycleHours) || cycleHours < 0 || cycleHours > 11) {
        toast({
          title: "Invalid cycle hours",
          description: "Cycle hours must be between 0 and 11.",
          variant: "destructive",
        });
        return;
      }
      
      // Call the onPlanTrip callback with the parsed data
      onPlanTrip(currentLocation, pickupLocation, dropoffLocation, cycleHours);
      
    } catch (error) {
      console.error("Error planning trip:", error);
      toast({
        title: "Error planning trip",
        description: "There was an error planning your trip. Please check your inputs and try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="w-full glass-panel">
      <CardHeader>
        <CardTitle className="text-xl">Trip Details</CardTitle>
        <CardDescription>Enter your trip information to generate a route plan and ELD logs</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="currentLocation">Current Location</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleGetCurrentLocation}
                disabled={gpsLoading}
                className="text-xs flex items-center gap-1 h-7"
              >
                {gpsLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Detecting...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="h-3 w-3" />
                    <span>Get GPS</span>
                  </>
                )}
              </Button>
            </div>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="currentLocation"
                placeholder="Enter city, address, or coordinates"
                className="pl-9 subtle-input"
                value={currentLocationInput}
                onChange={(e) => setCurrentLocationInput(e.target.value)}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter an address, city, or coordinates (e.g., "42.3601, -71.0589")
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pickupLocation">Pickup Location</Label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-accent" />
              <Input
                id="pickupLocation"
                placeholder="Enter pickup location"
                className="pl-9 subtle-input"
                value={pickupLocationInput}
                onChange={(e) => setPickupLocationInput(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dropoffLocation">Dropoff Location</Label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="dropoffLocation"
                placeholder="Enter dropoff location"
                className="pl-9 subtle-input"
                value={dropoffLocationInput}
                onChange={(e) => setDropoffLocationInput(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currentCycle">Current Cycle Used (Hours)</Label>
            <div className="relative">
              <Input
                id="currentCycle"
                type="number"
                min="0"
                max="11"
                step="0.5"
                placeholder="0"
                className="subtle-input"
                value={currentCycleUsed}
                onChange={(e) => setCurrentCycleUsed(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center text-xs text-muted-foreground gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span>Maximum daily driving limit is 11 hours</span>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full transition-all duration-200 bg-primary hover:bg-primary/90 active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Planning Trip...
              </>
            ) : (
              <>
                Plan Trip
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TripForm;
