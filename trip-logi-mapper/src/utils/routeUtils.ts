
interface Location {
  lat: number;
  lng: number;
  description?: string;
}

interface RouteStop {
  location: Location;
  arrivalTime: Date;
  departureTime: Date;
  type: "pickup" | "dropoff" | "rest" | "fuel" | "overnight";
  duration: number; // In minutes
  notes?: string;
}

interface RouteSegment {
  startLocation: Location;
  endLocation: Location;
  distance: number; // In miles
  duration: number; // In minutes
  departureTime: Date;
  arrivalTime: Date;
}

interface RouteInfo {
  totalDistance: number; // In miles
  totalDuration: number; // In minutes
  startTime: Date;
  endTime: Date;
  segments: RouteSegment[];
  stops: RouteStop[];
}

// Constants for HOS regulations
const MAX_DRIVING_HOURS_PER_DAY = 11; // Maximum driving hours per day
const MAX_ON_DUTY_HOURS_PER_DAY = 14; // Maximum on-duty hours per day
const MIN_OFF_DUTY_HOURS_PER_DAY = 10; // Minimum off-duty hours per day
const REQUIRED_BREAK_DURATION = 30; // Required break duration in minutes
const MAX_DRIVING_BEFORE_BREAK = 8 * 60; // Maximum driving time before break in minutes
const AVERAGE_SPEED = 55; // Average speed in mph
const FUEL_STOP_DURATION = 45; // Fuel stop duration in minutes
const MAX_DISTANCE_BETWEEN_FUEL = 1000; // Maximum distance between fuel stops in miles
const PICKUP_DROPOFF_DURATION = 60; // Pickup/dropoff duration in minutes

// Function to estimate driving time between two points
export const calculateDrivingTime = (start: Location, end: Location): number => {
  // In a real app, this would call a mapping API
  // For now, we'll use a simple approximation based on haversine distance
  const distance = calculateDistance(start, end);
  return (distance / AVERAGE_SPEED) * 60; // Convert to minutes
};

// Function to calculate distance between two points using Haversine formula
export const calculateDistance = (start: Location, end: Location): number => {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRad(end.lat - start.lat);
  const dLon = toRad(end.lng - start.lng);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(start.lat)) * Math.cos(toRad(end.lat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper function to convert degrees to radians
const toRad = (value: number): number => {
  return value * Math.PI / 180;
};

// Function to calculate a route with proper rest stops, fuel stops, etc.
export const calculateRoute = (
  currentLocation: Location,
  pickupLocation: Location,
  dropoffLocation: Location,
  currentCycleUsed: number // In hours
): RouteInfo => {
  const now = new Date();
  let currentTime = new Date(now);
  const stops: RouteStop[] = [];
  const segments: RouteSegment[] = [];
  
  let totalDistance = 0;
  let totalDuration = 0;
  
  // Remaining driving hours for the day
  let remainingDrivingMinutes = (MAX_DRIVING_HOURS_PER_DAY - currentCycleUsed) * 60;
  let minutesSinceLastBreak = currentCycleUsed * 60;
  let totalDrivingMinutes = 0;
  let distanceSinceLastFuel = 0;
  
  // Current location to pickup
  let toPickupDistance = calculateDistance(currentLocation, pickupLocation);
  let toPickupDuration = calculateDrivingTime(currentLocation, pickupLocation);
  
  totalDistance += toPickupDistance;
  totalDuration += toPickupDuration;
  distanceSinceLastFuel += toPickupDistance;
  
  // Check if we need a break before reaching pickup
  if (minutesSinceLastBreak + toPickupDuration > MAX_DRIVING_BEFORE_BREAK) {
    // Calculate how far we can drive before needing a break
    const minutesToBreak = MAX_DRIVING_BEFORE_BREAK - minutesSinceLastBreak;
    const distanceToBreak = (minutesToBreak / 60) * AVERAGE_SPEED;
    
    // Create an approximate break location (this should use the actual route API in production)
    const breakLocation: Location = {
      lat: currentLocation.lat + (pickupLocation.lat - currentLocation.lat) * (distanceToBreak / toPickupDistance),
      lng: currentLocation.lng + (pickupLocation.lng - currentLocation.lng) * (distanceToBreak / toPickupDistance),
      description: "Rest Stop"
    };
    
    // Add segment to break point
    const breakArrivalTime = new Date(currentTime.getTime() + minutesToBreak * 60000);
    segments.push({
      startLocation: currentLocation,
      endLocation: breakLocation,
      distance: distanceToBreak,
      duration: minutesToBreak,
      departureTime: new Date(currentTime),
      arrivalTime: breakArrivalTime
    });
    
    // Add rest stop
    const breakDepartureTime = new Date(breakArrivalTime.getTime() + REQUIRED_BREAK_DURATION * 60000);
    stops.push({
      location: breakLocation,
      arrivalTime: breakArrivalTime,
      departureTime: breakDepartureTime,
      type: "rest",
      duration: REQUIRED_BREAK_DURATION,
      notes: "Required 30-minute break"
    });
    
    // Update current values
    currentTime = new Date(breakDepartureTime);
    currentLocation = breakLocation;
    remainingDrivingMinutes -= minutesToBreak;
    minutesSinceLastBreak = 0;
    
    // Recalculate remaining trip to pickup
    toPickupDistance = calculateDistance(currentLocation, pickupLocation);
    toPickupDuration = calculateDrivingTime(currentLocation, pickupLocation);
  }
  
  // Add segment to pickup
  const pickupArrivalTime = new Date(currentTime.getTime() + toPickupDuration * 60000);
  segments.push({
    startLocation: currentLocation,
    endLocation: pickupLocation,
    distance: toPickupDistance,
    duration: toPickupDuration,
    departureTime: new Date(currentTime),
    arrivalTime: pickupArrivalTime
  });
  
  // Add pickup stop
  const pickupDepartureTime = new Date(pickupArrivalTime.getTime() + PICKUP_DROPOFF_DURATION * 60000);
  stops.push({
    location: pickupLocation,
    arrivalTime: pickupArrivalTime,
    departureTime: pickupDepartureTime,
    type: "pickup",
    duration: PICKUP_DROPOFF_DURATION,
    notes: "Pickup location"
  });
  
  // Update current values
  currentTime = new Date(pickupDepartureTime);
  currentLocation = pickupLocation;
  remainingDrivingMinutes -= toPickupDuration;
  minutesSinceLastBreak += toPickupDuration;
  
  // Pickup to dropoff
  let toDropoffDistance = calculateDistance(currentLocation, dropoffLocation);
  let toDropoffDuration = calculateDrivingTime(currentLocation, dropoffLocation);
  
  totalDistance += toDropoffDistance;
  totalDuration += toDropoffDuration + PICKUP_DROPOFF_DURATION * 2; // Include pickup and dropoff times
  
  // Process the route to dropoff, adding breaks, overnight stops, and fuel stops as needed
  while (toDropoffDistance > 0) {
    // Check if we need an overnight rest
    if (remainingDrivingMinutes <= 0) {
      // Add overnight stop
      const overnightDepartureTime = new Date(currentTime.getTime() + MIN_OFF_DUTY_HOURS_PER_DAY * 60 * 60000);
      stops.push({
        location: currentLocation,
        arrivalTime: new Date(currentTime),
        departureTime: overnightDepartureTime,
        type: "overnight",
        duration: MIN_OFF_DUTY_HOURS_PER_DAY * 60,
        notes: "Required 10-hour break"
      });
      
      // Reset driving limits
      currentTime = new Date(overnightDepartureTime);
      remainingDrivingMinutes = MAX_DRIVING_HOURS_PER_DAY * 60;
      minutesSinceLastBreak = 0;
      continue;
    }
    
    // Check if we need a fuel stop
    if (distanceSinceLastFuel + Math.min(toDropoffDistance, remainingDrivingMinutes / 60 * AVERAGE_SPEED) > MAX_DISTANCE_BETWEEN_FUEL) {
      // Create an approximate fuel location
      const minutesToFuel = (MAX_DISTANCE_BETWEEN_FUEL - distanceSinceLastFuel) / AVERAGE_SPEED * 60;
      const distanceToFuel = (minutesToFuel / 60) * AVERAGE_SPEED;
      
      const fuelLocation: Location = {
        lat: currentLocation.lat + (dropoffLocation.lat - currentLocation.lat) * (distanceToFuel / toDropoffDistance),
        lng: currentLocation.lng + (dropoffLocation.lng - currentLocation.lng) * (distanceToFuel / toDropoffDistance),
        description: "Fuel Stop"
      };
      
      // Add segment to fuel point
      const fuelArrivalTime = new Date(currentTime.getTime() + minutesToFuel * 60000);
      segments.push({
        startLocation: currentLocation,
        endLocation: fuelLocation,
        distance: distanceToFuel,
        duration: minutesToFuel,
        departureTime: new Date(currentTime),
        arrivalTime: fuelArrivalTime
      });
      
      // Add fuel stop
      const fuelDepartureTime = new Date(fuelArrivalTime.getTime() + FUEL_STOP_DURATION * 60000);
      stops.push({
        location: fuelLocation,
        arrivalTime: fuelArrivalTime,
        departureTime: fuelDepartureTime,
        type: "fuel",
        duration: FUEL_STOP_DURATION,
        notes: "Fuel stop"
      });
      
      // Update current values
      currentTime = new Date(fuelDepartureTime);
      currentLocation = fuelLocation;
      remainingDrivingMinutes -= minutesToFuel;
      minutesSinceLastBreak += minutesToFuel;
      distanceSinceLastFuel = 0;
      
      // Recalculate remaining trip to dropoff
      toDropoffDistance = calculateDistance(currentLocation, dropoffLocation);
      toDropoffDuration = calculateDrivingTime(currentLocation, dropoffLocation);
      continue;
    }
    
    // Check if we need a break
    if (minutesSinceLastBreak + Math.min(toDropoffDuration, remainingDrivingMinutes) > MAX_DRIVING_BEFORE_BREAK) {
      // Calculate how far we can drive before needing a break
      const minutesToBreak = MAX_DRIVING_BEFORE_BREAK - minutesSinceLastBreak;
      const distanceToBreak = (minutesToBreak / 60) * AVERAGE_SPEED;
      
      // Create an approximate break location
      const breakLocation: Location = {
        lat: currentLocation.lat + (dropoffLocation.lat - currentLocation.lat) * (distanceToBreak / toDropoffDistance),
        lng: currentLocation.lng + (dropoffLocation.lng - currentLocation.lng) * (distanceToBreak / toDropoffDistance),
        description: "Rest Stop"
      };
      
      // Add segment to break point
      const breakArrivalTime = new Date(currentTime.getTime() + minutesToBreak * 60000);
      segments.push({
        startLocation: currentLocation,
        endLocation: breakLocation,
        distance: distanceToBreak,
        duration: minutesToBreak,
        departureTime: new Date(currentTime),
        arrivalTime: breakArrivalTime
      });
      
      // Add rest stop
      const breakDepartureTime = new Date(breakArrivalTime.getTime() + REQUIRED_BREAK_DURATION * 60000);
      stops.push({
        location: breakLocation,
        arrivalTime: breakArrivalTime,
        departureTime: breakDepartureTime,
        type: "rest",
        duration: REQUIRED_BREAK_DURATION,
        notes: "Required 30-minute break"
      });
      
      // Update current values
      currentTime = new Date(breakDepartureTime);
      currentLocation = breakLocation;
      remainingDrivingMinutes -= minutesToBreak;
      minutesSinceLastBreak = 0;
      distanceSinceLastFuel += distanceToBreak;
      
      // Recalculate remaining trip to dropoff
      toDropoffDistance = calculateDistance(currentLocation, dropoffLocation);
      toDropoffDuration = calculateDrivingTime(currentLocation, dropoffLocation);
      continue;
    }
    
    // We can complete the remaining segment to dropoff
    const drivableMinutes = Math.min(toDropoffDuration, remainingDrivingMinutes);
    const drivableDistance = Math.min(toDropoffDistance, (drivableMinutes / 60) * AVERAGE_SPEED);
    
    if (drivableDistance < toDropoffDistance) {
      // We can only drive part of the way
      const partialLocation: Location = {
        lat: currentLocation.lat + (dropoffLocation.lat - currentLocation.lat) * (drivableDistance / toDropoffDistance),
        lng: currentLocation.lng + (dropoffLocation.lng - currentLocation.lng) * (drivableDistance / toDropoffDistance),
        description: "Overnight Stop"
      };
      
      // Add segment to partial point
      const partialArrivalTime = new Date(currentTime.getTime() + drivableMinutes * 60000);
      segments.push({
        startLocation: currentLocation,
        endLocation: partialLocation,
        distance: drivableDistance,
        duration: drivableMinutes,
        departureTime: new Date(currentTime),
        arrivalTime: partialArrivalTime
      });
      
      // Add overnight stop
      const overnightDepartureTime = new Date(partialArrivalTime.getTime() + MIN_OFF_DUTY_HOURS_PER_DAY * 60 * 60000);
      stops.push({
        location: partialLocation,
        arrivalTime: partialArrivalTime,
        departureTime: overnightDepartureTime,
        type: "overnight",
        duration: MIN_OFF_DUTY_HOURS_PER_DAY * 60,
        notes: "Required 10-hour break"
      });
      
      // Update current values
      currentTime = new Date(overnightDepartureTime);
      currentLocation = partialLocation;
      remainingDrivingMinutes = MAX_DRIVING_HOURS_PER_DAY * 60;
      minutesSinceLastBreak = 0;
      distanceSinceLastFuel += drivableDistance;
      
      // Recalculate remaining trip to dropoff
      toDropoffDistance = calculateDistance(currentLocation, dropoffLocation);
      toDropoffDuration = calculateDrivingTime(currentLocation, dropoffLocation);
    } else {
      // We can reach the dropoff
      const dropoffArrivalTime = new Date(currentTime.getTime() + toDropoffDuration * 60000);
      segments.push({
        startLocation: currentLocation,
        endLocation: dropoffLocation,
        distance: toDropoffDistance,
        duration: toDropoffDuration,
        departureTime: new Date(currentTime),
        arrivalTime: dropoffArrivalTime
      });
      
      // Add dropoff stop
      const dropoffDepartureTime = new Date(dropoffArrivalTime.getTime() + PICKUP_DROPOFF_DURATION * 60000);
      stops.push({
        location: dropoffLocation,
        arrivalTime: dropoffArrivalTime,
        departureTime: dropoffDepartureTime,
        type: "dropoff",
        duration: PICKUP_DROPOFF_DURATION,
        notes: "Dropoff location"
      });
      
      // Update current values and complete the route
      currentTime = new Date(dropoffDepartureTime);
      remainingDrivingMinutes -= toDropoffDuration;
      minutesSinceLastBreak += toDropoffDuration;
      distanceSinceLastFuel += toDropoffDistance;
      
      // End the loop
      toDropoffDistance = 0;
    }
  }
  
  return {
    totalDistance,
    totalDuration,
    startTime: segments[0]?.departureTime || now,
    endTime: currentTime,
    segments,
    stops
  };
};

export type { Location, RouteStop, RouteSegment, RouteInfo };
