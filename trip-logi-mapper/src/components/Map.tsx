import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RouteInfo, RouteStop } from '@/utils/routeUtils';
import { Info, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface MapProps {
  routeInfo?: RouteInfo;
}

const Map: React.FC<MapProps> = ({ routeInfo }) => {
  const { toast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>(() => {
    return localStorage.getItem('mapbox_token') || '';
  });
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [tokenError, setTokenError] = useState('');
  
  useEffect(() => {
    if (!mapboxToken) {
      setShowTokenDialog(true);
    }
  }, [mapboxToken]);
  
  useEffect(() => {
    if (!mapLoaded) {
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js';
      script.async = true;
      script.onload = () => {
        setMapLoaded(true);
        
        const link = document.createElement('link');
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      };
      document.head.appendChild(script);
    }
  }, [mapLoaded]);
  
  useEffect(() => {
    if (mapLoaded && !mapInitialized && mapContainerRef.current && mapboxToken) {
      const mapboxgl = (window as any).mapboxgl;
      
      if (!mapboxgl) {
        console.error("Mapbox GL JS not loaded");
        return;
      }
      
      try {
        mapboxgl.accessToken = mapboxToken;
        
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-98, 39],
          zoom: 3,
          interactive: true,
        });
        
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
        
        map.on('load', () => {
          setMapInitialized(true);
          
          (window as any)._mapInstance = map;
          
          toast({
            title: "Map loaded successfully",
            description: "Using your Mapbox access token",
          });
        });
        
        map.on('error', (e: any) => {
          if (e.error && e.error.status === 401) {
            toast({
              title: "Invalid Mapbox token",
              description: "Please update your token in the settings",
              variant: "destructive",
            });
            localStorage.removeItem('mapbox_token');
            setMapboxToken('');
          }
        });
        
        return () => {
          map.remove();
          if ((window as any)._mapInstance) {
            delete (window as any)._mapInstance;
          }
        };
      } catch (error) {
        console.error("Error initializing map:", error);
        toast({
          title: "Map initialization error",
          description: "There was a problem loading the map",
          variant: "destructive",
        });
      }
    }
  }, [mapLoaded, mapInitialized, mapboxToken, toast]);
  
  useEffect(() => {
    const map = (window as any)._mapInstance;
    
    if (map && routeInfo && routeInfo.segments.length > 0) {
      if (map.getSource('route')) {
        map.removeLayer('route-line');
        map.removeSource('route');
      }
      
      const coordinates = routeInfo.segments.flatMap((segment, index) => {
        if (index === 0) {
          return [
            [segment.startLocation.lng, segment.startLocation.lat],
            [segment.endLocation.lng, segment.endLocation.lat]
          ];
        }
        return [[segment.endLocation.lng, segment.endLocation.lat]];
      });
      
      map.addSource('route', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'LineString',
            'coordinates': coordinates
          }
        }
      });
      
      map.addLayer({
        'id': 'route-line',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': 'hsl(var(--primary))',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
      
      const markers = document.querySelectorAll('.mapboxgl-marker');
      markers.forEach(marker => marker.remove());
      
      routeInfo.stops.forEach((stop) => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.backgroundSize = 'cover';
        el.style.borderRadius = '50%';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        
        switch(stop.type) {
          case 'pickup':
            el.style.backgroundColor = '#4ade80';
            break;
          case 'dropoff':
            el.style.backgroundColor = '#f87171';
            break;
          case 'rest':
            el.style.backgroundColor = '#facc15';
            break;
          case 'fuel':
            el.style.backgroundColor = '#60a5fa';
            break;
          case 'overnight':
            el.style.backgroundColor = '#a78bfa';
            break;
          default:
            el.style.backgroundColor = '#94a3b8';
        }
        
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        
        const popup = new (window as any).mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="font-family: 'Inter', sans-serif; padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${stop.type.charAt(0).toUpperCase() + stop.type.slice(1)}</div>
              <div style="font-size: 12px; margin-bottom: 4px;">${stop.location.description || `Location: ${stop.location.lat.toFixed(5)}, ${stop.location.lng.toFixed(5)}`}</div>
              <div style="font-size: 12px; margin-bottom: 4px;">Arrival: ${formatTime(stop.arrivalTime)}</div>
              <div style="font-size: 12px; margin-bottom: 4px;">Departure: ${formatTime(stop.departureTime)}</div>
              <div style="font-size: 12px;">${stop.notes || ''}</div>
            </div>
          `);
        
        new (window as any).mapboxgl.Marker(el)
          .setLngLat([stop.location.lng, stop.location.lat])
          .setPopup(popup)
          .addTo(map);
      });
      
      const bounds = new (window as any).mapboxgl.LngLatBounds();
      coordinates.forEach(coord => bounds.extend(coord));
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [routeInfo]);
  
  const handleTokenSubmit = () => {
    if (!tempToken.trim()) {
      setTokenError('Please enter a valid Mapbox token');
      return;
    }
    
    localStorage.setItem('mapbox_token', tempToken);
    setMapboxToken(tempToken);
    setShowTokenDialog(false);
    setTokenError('');
    window.location.reload();
  };
  
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
  
  return (
    <>
      <Card className="w-full h-full glass-panel">
        <CardContent className="p-0 overflow-hidden rounded-lg">
          <div ref={mapContainerRef} className="min-h-[400px] w-full rounded-lg relative">
            {!mapboxToken ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 backdrop-blur-sm">
                <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
                <h3 className="font-medium text-lg mb-2">Mapbox Token Required</h3>
                <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
                  To use the map features, you need to provide a Mapbox access token.
                </p>
                <Button onClick={() => setShowTokenDialog(true)}>
                  Enter Mapbox Token
                </Button>
              </div>
            ) : (!mapLoaded || !mapInitialized) ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 backdrop-blur-sm">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <span className="text-sm text-muted-foreground">Loading map...</span>
                </div>
              </div>
            ) : null}
            
            {routeInfo && mapInitialized && (
              <div className="absolute bottom-3 right-3 left-3 md:left-auto md:max-w-[280px] bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-soft border border-white/30 z-10">
                <div className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-primary" />
                  <span>Trip Summary</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Distance:</span>
                    <span className="font-medium">{routeInfo.totalDistance.toFixed(1)} miles</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Duration:</span>
                    <span className="font-medium">{(routeInfo.totalDuration / 60).toFixed(1)} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Time:</span>
                    <span className="font-medium">{formatTime(routeInfo.startTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End Time:</span>
                    <span className="font-medium">{formatTime(routeInfo.endTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Number of Stops:</span>
                    <span className="font-medium">{routeInfo.stops.length}</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <div className="text-xs font-medium mb-1">Stop Types:</div>
                  <div className="flex gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                      <span className="text-xs">Pickup</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                      <span className="text-xs">Dropoff</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                      <span className="text-xs">Rest</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
                      <span className="text-xs">Fuel</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-400"></div>
                      <span className="text-xs">Overnight</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Mapbox Access Token</DialogTitle>
            <DialogDescription>
              To display maps, you need a Mapbox public access token. You can get one by creating an account at mapbox.com.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
              <Input 
                id="mapbox-token" 
                placeholder="pk.eyJ1..." 
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value)}
              />
              {tokenError && <p className="text-sm text-destructive">{tokenError}</p>}
            </div>
            
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-xs text-muted-foreground">
                <strong>How to get a token:</strong><br />
                1. Go to <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a> and create an account<br />
                2. Navigate to your account dashboard<br />
                3. Find "Access tokens" and copy your default public token
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTokenDialog(false)}>Cancel</Button>
            <Button onClick={handleTokenSubmit}>Save Token</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Map;
