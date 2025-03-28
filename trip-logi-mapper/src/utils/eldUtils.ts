
import { RouteStop, RouteSegment, RouteInfo } from './routeUtils';

// ELD Status types
export type EldStatus = "OFF" | "SB" | "DR" | "ON";

// Interface for ELD log entry
export interface EldLogEntry {
  time: Date;
  status: EldStatus;
  location: string;
  notes?: string;
}

// Interface for a daily ELD log
export interface EldDailyLog {
  date: Date;
  entries: EldLogEntry[];
  totalDrivingHours: number;
  totalOnDutyHours: number;
  remainingDrivingHours: number;
  remainingOnDutyHours: number;
}

// Function to generate ELD logs from route information
export const generateEldLogs = (routeInfo: RouteInfo): EldDailyLog[] => {
  const logs: EldDailyLog[] = [];
  const { segments, stops } = routeInfo;
  
  // Combine segments and stops in chronological order
  const events: Array<{
    time: Date;
    type: "segment_start" | "segment_end" | "stop_start" | "stop_end";
    segmentIndex?: number;
    stopIndex?: number;
  }> = [];
  
  // Add segment events
  segments.forEach((segment, index) => {
    events.push({
      time: segment.departureTime,
      type: "segment_start",
      segmentIndex: index
    });
    
    events.push({
      time: segment.arrivalTime,
      type: "segment_end",
      segmentIndex: index
    });
  });
  
  // Add stop events
  stops.forEach((stop, index) => {
    events.push({
      time: stop.arrivalTime,
      type: "stop_start",
      stopIndex: index
    });
    
    events.push({
      time: stop.departureTime,
      type: "stop_end",
      stopIndex: index
    });
  });
  
  // Sort events chronologically
  events.sort((a, b) => a.time.getTime() - b.time.getTime());
  
  // Process events to create ELD logs
  let currentDay = events.length > 0 ? new Date(events[0].time) : new Date();
  currentDay.setHours(0, 0, 0, 0);
  
  let currentLog: EldDailyLog = {
    date: new Date(currentDay),
    entries: [],
    totalDrivingHours: 0,
    totalOnDutyHours: 0,
    remainingDrivingHours: 11, // 11 hour driving limit
    remainingOnDutyHours: 14   // 14 hour on-duty limit
  };
  
  let currentStatus: EldStatus = "OFF";
  
  events.forEach((event) => {
    // Check if this event is on a new day
    const eventDay = new Date(event.time);
    eventDay.setHours(0, 0, 0, 0);
    
    if (eventDay.getTime() !== currentDay.getTime()) {
      // Add the current log to logs array
      logs.push(currentLog);
      
      // Start a new log
      currentDay = eventDay;
      currentLog = {
        date: new Date(currentDay),
        entries: [],
        totalDrivingHours: 0,
        totalOnDutyHours: 0,
        remainingDrivingHours: 11,
        remainingOnDutyHours: 14
      };
      
      // Add OFF duty entry for midnight
      currentLog.entries.push({
        time: new Date(currentDay),
        status: currentStatus,
        location: "Continuing from previous day"
      });
    }
    
    // Process event
    switch (event.type) {
      case "segment_start":
        if (segments[event.segmentIndex!]) {
          const newStatus: EldStatus = "DR";
          
          // Only add an entry if status changes
          if (newStatus !== currentStatus) {
            currentLog.entries.push({
              time: event.time,
              status: newStatus,
              location: segments[event.segmentIndex!].startLocation.description || 
                       `${segments[event.segmentIndex!].startLocation.lat.toFixed(5)}, ${segments[event.segmentIndex!].startLocation.lng.toFixed(5)}`
            });
            currentStatus = newStatus;
          }
        }
        break;
      
      case "segment_end":
        // No status change at segment end, as status will change based on stop type
        break;
      
      case "stop_start":
        if (stops[event.stopIndex!]) {
          let newStatus: EldStatus;
          const stop = stops[event.stopIndex!];
          
          switch (stop.type) {
            case "rest":
            case "overnight":
              newStatus = "OFF";
              break;
            case "fuel":
              newStatus = "ON";
              break;
            case "pickup":
            case "dropoff":
              newStatus = "ON";
              break;
            default:
              newStatus = "SB";
              break;
          }
          
          // Only add an entry if status changes
          if (newStatus !== currentStatus) {
            currentLog.entries.push({
              time: event.time,
              status: newStatus,
              location: stop.location.description || 
                       `${stop.location.lat.toFixed(5)}, ${stop.location.lng.toFixed(5)}`,
              notes: stop.notes
            });
            currentStatus = newStatus;
          }
        }
        break;
      
      case "stop_end":
        // The next event will set the appropriate status
        break;
    }
  });
  
  // Add the final log
  if (currentLog.entries.length > 0) {
    logs.push(currentLog);
  }
  
  // Calculate hours for each log
  logs.forEach(log => {
    let entries = [...log.entries];
    
    // Add an entry for the end of the day if the last entry isn't at the end of the day
    const endOfDay = new Date(log.date);
    endOfDay.setHours(23, 59, 59, 999);
    
    if (entries.length > 0 && entries[entries.length - 1].time.getTime() < endOfDay.getTime()) {
      entries.push({
        time: endOfDay,
        status: entries[entries.length - 1].status,
        location: entries[entries.length - 1].location
      });
    }
    
    // Calculate total hours per status
    let drivingHours = 0;
    let onDutyHours = 0;
    
    for (let i = 0; i < entries.length - 1; i++) {
      const duration = (entries[i + 1].time.getTime() - entries[i].time.getTime()) / (1000 * 60 * 60); // Hours
      
      if (entries[i].status === "DR") {
        drivingHours += duration;
        onDutyHours += duration;
      } else if (entries[i].status === "ON") {
        onDutyHours += duration;
      }
    }
    
    log.totalDrivingHours = drivingHours;
    log.totalOnDutyHours = onDutyHours;
    log.remainingDrivingHours = Math.max(0, 11 - drivingHours);
    log.remainingOnDutyHours = Math.max(0, 14 - onDutyHours);
  });
  
  return logs;
};

// Function to get visual data for the ELD graph
export const getEldGraphData = (log: EldDailyLog) => {
  if (!log.entries.length) return [];
  
  // Make sure entries are sorted
  const sortedEntries = [...log.entries].sort((a, b) => a.time.getTime() - b.time.getTime());
  
  // Create a data point for the start of the day
  const startOfDay = new Date(log.date);
  let graphData = [];
  
  // If first entry is not at midnight, add a point for midnight with the same status as the first entry
  if (sortedEntries[0].time.getTime() > startOfDay.getTime()) {
    graphData.push({
      time: startOfDay,
      status: sortedEntries[0].status
    });
  }
  
  // Add all entries
  graphData = [...graphData, ...sortedEntries.map(entry => ({
    time: entry.time,
    status: entry.status
  }))];
  
  // Add a point for end of day if the last entry is not at the end of the day
  const endOfDay = new Date(log.date);
  endOfDay.setHours(23, 59, 59, 999);
  
  if (sortedEntries[sortedEntries.length - 1].time.getTime() < endOfDay.getTime()) {
    graphData.push({
      time: endOfDay,
      status: sortedEntries[sortedEntries.length - 1].status
    });
  }
  
  return graphData;
};
