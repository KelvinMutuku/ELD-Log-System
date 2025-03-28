
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import DailyLogEditor from '@/components/DailyLogEditor';
import { EldDailyLog } from '@/utils/eldUtils';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

const LogEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [log, setLog] = useState<EldDailyLog | null>(null);
  
  useEffect(() => {
    // Get log data from location state
    if (location.state && location.state.log) {
      setLog(location.state.log);
    } else {
      // If no log data, redirect back to home
      navigate('/');
    }
  }, [location, navigate]);
  
  const handleBack = () => {
    navigate('/');
  };
  
  const handleSave = (image: string) => {
    // In a real app, you'd save this to a database
    console.log('Saved log image:', image.substring(0, 100) + '...');
    
    // Store in localStorage for demo purposes
    const storedLogs = JSON.parse(localStorage.getItem('eldLogImages') || '{}');
    if (log) {
      const logId = log.date.toString();
      storedLogs[logId] = image;
      localStorage.setItem('eldLogImages', JSON.stringify(storedLogs));
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        
        {log ? (
          <DailyLogEditor log={log} onSave={handleSave} onClose={handleBack} />
        ) : (
          <div className="text-center py-12">
            <p>Loading log data...</p>
          </div>
        )}
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

export default LogEditor;
