import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import Header from "@/components/Header";
import TripForm from "@/components/TripForm";
import Map from "@/components/Map";
import LogSheet from "@/components/LogSheet";
import FuelStops from "@/components/FuelStops";
import { Location, RouteInfo, calculateRoute, RouteStop } from "@/utils/routeUtils";
import { EldDailyLog, generateEldLogs } from "@/utils/eldUtils";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [routeInfo, setRouteInfo] = useState<RouteInfo | undefined>();
  const [eldLogs, setEldLogs] = useState<EldDailyLog[]>([]);
  const [fuelStops, setFuelStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]); // Store fetched drivers

  // Fetch stored drivers from Django API
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/drivers/")
      .then(response => {
        setDrivers(response.data);
      })
      .catch(error => {
        console.error("Error fetching drivers:", error);
        toast({
          title: "Error loading drivers",
          description: "Could not fetch driver data.",
          variant: "destructive",
        });
      });
  }, []);

  const handlePlanTrip = useCallback(async (
    currentLocation: Location,
    pickupLocation: Location,
    dropoffLocation: Location,
    currentCycleUsed: number
  ) => {
    setLoading(true);

    try {
      // Small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Calculate route
      const route = calculateRoute(
        currentLocation,
        pickupLocation,
        dropoffLocation,
        currentCycleUsed
      );

      setRouteInfo(route);

      // Generate ELD logs
      const logs = generateEldLogs(route);
      setEldLogs(logs);

      // Extract fuel stops
      const fuelStopsOnly = route.stops.filter(stop => stop.type === 'fuel');
      setFuelStops(fuelStopsOnly);

      toast({
        title: "Trip planned successfully",
        description: `Route created with ${route.stops.length} stops and ${logs.length} daily logs.`,
      });
    } catch (error) {
      console.error("Error planning trip:", error);
      toast({
        title: "Error planning trip",
        description: "There was an error planning your trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container max-w-7xl mx-auto px-4 py-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <TripForm onPlanTrip={handlePlanTrip} isLoading={loading} />
            <div className="mt-6">
              <FuelStops fuelStops={fuelStops} />
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Map routeInfo={routeInfo} />
            <LogSheet logs={eldLogs} />

            {/* Stored Drivers Section */}
            <div className="bg-white shadow-md rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Stored Drivers</h2>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Name</th>
                    <th className="border p-2">License</th>
                    <th className="border p-2">Current Location</th>
                    <th className="border p-2">Pickup</th>
                    <th className="border p-2">Dropoff</th>
                    <th className="border p-2">Cycle Used (Hours)</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map(driver => (
                    <tr key={driver.id} className="border-b">
                      <td className="border p-2">{driver.first_name} {driver.last_name}</td>
                      <td className="border p-2">{driver.license_number}</td>
                      <td className="border p-2">{driver.current_location}</td>
                      <td className="border p-2">{driver.pickup_location}</td>
                      <td className="border p-2">{driver.dropoff_location}</td>
                      <td className="border p-2">{driver.current_cycle_used}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-border/40 bg-background/50 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              TripLogiMapper — Route planning and ELD logging for truck drivers
            </p>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
