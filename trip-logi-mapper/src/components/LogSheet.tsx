
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EldDailyLog, EldStatus, getEldGraphData } from '@/utils/eldUtils';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Download, Clipboard, Clock, ClipboardCheck, Edit } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";

interface LogSheetProps {
  logs: EldDailyLog[];
}

const LogSheet: React.FC<LogSheetProps> = ({ logs }) => {
  const { toast } = useToast();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [logImages, setLogImages] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const storedLogs = JSON.parse(localStorage.getItem('eldLogImages') || '{}');
    setLogImages(storedLogs);
  }, []);

  const handlePrevious = () => {
    setActiveTabIndex(Math.max(0, activeTabIndex - 1));
  };
  
  const handleNext = () => {
    setActiveTabIndex(Math.min(logs.length - 1, activeTabIndex + 1));
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const getStatusColor = (status: EldStatus) => {
    switch (status) {
      case 'OFF':
        return 'bg-gray-200';
      case 'SB':
        return 'bg-yellow-100';
      case 'DR':
        return 'bg-red-100';
      case 'ON':
        return 'bg-green-100';
      default:
        return 'bg-white';
    }
  };
  
  const getStatusLabel = (status: EldStatus) => {
    switch (status) {
      case 'OFF':
        return 'Off Duty';
      case 'SB':
        return 'Sleeper Berth';
      case 'DR':
        return 'Driving';
      case 'ON':
        return 'On Duty (Not Driving)';
      default:
        return '';
    }
  };
  
  const handleCopyLog = (log: EldDailyLog) => {
    const entries = log.entries.map(entry => 
      `${formatTime(entry.time)} - ${getStatusLabel(entry.status)} - ${entry.location}`
    ).join('\n');
    
    const summaryText = `
ELD Log for ${formatDate(log.date)}
Total Driving Hours: ${log.totalDrivingHours.toFixed(2)} hrs
Total On-Duty Hours: ${log.totalOnDutyHours.toFixed(2)} hrs
Remaining Driving Hours: ${log.remainingDrivingHours.toFixed(2)} hrs
Remaining On-Duty Hours: ${log.remainingOnDutyHours.toFixed(2)} hrs

Log Entries:
${entries}
`;
    
    navigator.clipboard.writeText(summaryText)
      .then(() => {
        toast({
          title: "Log copied to clipboard",
          description: "You can now paste the log data.",
        });
      })
      .catch(() => {
        toast({
          title: "Failed to copy",
          description: "Could not copy log to clipboard.",
          variant: "destructive",
        });
      });
  };
  
  const handleEditLog = (log: EldDailyLog) => {
    navigate('/log-editor', { state: { log } });
  };

  const handleDownloadPdf = (log: EldDailyLog) => {
    const pdf = new jsPDF();
    const logId = log.date.toString();
    const formattedDate = formatDate(log.date);
    
    // Set up PDF document
    pdf.setFontSize(18);
    pdf.text(`ELD Daily Log: ${formattedDate}`, 14, 22);
    
    pdf.setFontSize(12);
    pdf.text(`Driver Hours Summary`, 14, 35);
    pdf.setFontSize(10);
    pdf.text(`Total Driving Hours: ${log.totalDrivingHours.toFixed(1)} hrs`, 14, 45);
    pdf.text(`Remaining Driving Hours: ${log.remainingDrivingHours.toFixed(1)} hrs`, 14, 55);
    pdf.text(`Total On-Duty Hours: ${log.totalOnDutyHours.toFixed(1)} hrs`, 110, 45);
    pdf.text(`Remaining On-Duty Hours: ${log.remainingOnDutyHours.toFixed(1)} hrs`, 110, 55);
    
    // Add duty status grid (either from saved image or generate one)
    pdf.setFontSize(12);
    pdf.text("Duty Status Graph", 14, 70);
    
    if (logImages[logId]) {
      // Use the saved drawing if available
      pdf.addImage(logImages[logId], 'PNG', 14, 75, 180, 70);
    } else {
      // Add note that no graph drawing is available
      pdf.setFontSize(10);
      pdf.text("No hand-drawn duty status graph available", 14, 90);
    }
    
    // Add status entries table
    pdf.setFontSize(12);
    pdf.text("Log Entries", 14, 155);
    
    let y = 165;
    pdf.setFontSize(8);
    pdf.text("Time", 14, y);
    pdf.text("Status", 40, y);
    pdf.text("Location", 80, y);
    pdf.text("Notes", 150, y);
    
    y += 5;
    pdf.line(14, y, 196, y); // Horizontal line after headers
    
    // Add entries
    log.entries.forEach(entry => {
      y += 8;
      if (y > 280) { // Check if we need a new page
        pdf.addPage();
        y = 20;
      }
      
      pdf.text(formatTime(entry.time), 14, y);
      pdf.text(getStatusLabel(entry.status), 40, y);
      
      // Handle long location text
      const location = entry.location || "";
      if (location.length > 40) {
        pdf.text(location.substring(0, 40) + "...", 80, y);
      } else {
        pdf.text(location, 80, y);
      }
      
      // Handle notes (optional)
      if (entry.notes) {
        if (entry.notes.length > 25) {
          pdf.text(entry.notes.substring(0, 25) + "...", 150, y);
        } else {
          pdf.text(entry.notes, 150, y);
        }
      } else {
        pdf.text("-", 150, y);
      }
    });
    
    // Add footer with certification
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(`Driver Certification: I hereby certify that my duty status for this 24-hour period is true and correct.`, 14, 285);
      pdf.text(`Driver Signature: ______________________________  Date: _______________`, 14, 290);
      pdf.text(`Page ${i} of ${pageCount}`, 180, 290);
    }
    
    // Save PDF
    pdf.save(`ELD_Log_${formattedDate.replace(/,/g, '').replace(/ /g, '_')}.pdf`);
    
    toast({
      title: "PDF Downloaded",
      description: `ELD log for ${formattedDate} has been downloaded.`
    });
  };

  const renderEldGrid = (log: EldDailyLog) => {
    const logId = log.date.toString();
    if (logImages[logId]) {
      return (
        <div className="mt-4 overflow-x-auto pb-2">
          <img 
            src={logImages[logId]} 
            alt={`ELD Log for ${formatDate(log.date)}`} 
            className="max-w-full h-auto"
          />
        </div>
      );
    }
    
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    const graphData = getEldGraphData(log);
    
    const midnight = new Date(log.date);
    midnight.setHours(0, 0, 0, 0);
    
    const hourEntries: { [hour: number]: { status: EldStatus, percentage: number }[] } = {};
    
    hours.forEach(hour => {
      hourEntries[hour] = [];
    });
    
    for (let i = 0; i < graphData.length - 1; i++) {
      const startTime = new Date(graphData[i].time);
      const endTime = new Date(graphData[i + 1].time);
      const status = graphData[i].status;
      
      const startHour = startTime.getHours();
      const startMinute = startTime.getMinutes();
      const endHour = endTime.getHours();
      const endMinute = endTime.getMinutes();
      
      if (startHour === endHour) {
        const percentage = (endMinute - startMinute) / 60;
        hourEntries[startHour].push({ 
          status, 
          percentage 
        });
        continue;
      }
      
      const firstHourPercentage = (60 - startMinute) / 60;
      hourEntries[startHour].push({ 
        status, 
        percentage: firstHourPercentage 
      });
      
      for (let h = startHour + 1; h < endHour; h++) {
        hourEntries[h].push({ 
          status, 
          percentage: 1 
        });
      }
      
      const lastHourPercentage = endMinute / 60;
      if (lastHourPercentage > 0) {
        hourEntries[endHour].push({ 
          status, 
          percentage: lastHourPercentage 
        });
      }
    }
    
    return (
      <div className="mt-4 overflow-x-auto pb-2">
        <div className="min-w-max">
          <div className="flex border-b border-gray-300">
            <div className="w-16 text-xs text-muted-foreground px-1"></div>
            {hours.map((hour) => (
              <div key={hour} className="w-10 text-center text-xs text-muted-foreground py-1">
                {hour}
              </div>
            ))}
          </div>
          
          <div className="flex">
            <div className="w-16 flex flex-col justify-center py-2 pr-1">
              <div className="text-xs font-medium text-muted-foreground">Off Duty</div>
              <div className="text-xs font-medium text-muted-foreground">Sleeper</div>
              <div className="text-xs font-medium text-muted-foreground">Driving</div>
              <div className="text-xs font-medium text-muted-foreground">On Duty</div>
            </div>
            <div className="flex-1">
              <div className="h-8 border-b border-gray-300 flex">
                {hours.map((hour) => (
                  <div key={`off-${hour}`} className="w-10 h-full relative border-r border-gray-300">
                    {hourEntries[hour].map((entry, idx) => (
                      entry.status === 'OFF' && (
                        <div 
                          key={idx}
                          className="absolute top-0 left-0 h-full bg-gray-200"
                          style={{ width: `${entry.percentage * 100}%` }}
                        ></div>
                      )
                    ))}
                  </div>
                ))}
              </div>
              <div className="h-8 border-b border-gray-300 flex">
                {hours.map((hour) => (
                  <div key={`sb-${hour}`} className="w-10 h-full relative border-r border-gray-300">
                    {hourEntries[hour].map((entry, idx) => (
                      entry.status === 'SB' && (
                        <div 
                          key={idx}
                          className="absolute top-0 left-0 h-full bg-yellow-100"
                          style={{ width: `${entry.percentage * 100}%` }}
                        ></div>
                      )
                    ))}
                  </div>
                ))}
              </div>
              <div className="h-8 border-b border-gray-300 flex">
                {hours.map((hour) => (
                  <div key={`dr-${hour}`} className="w-10 h-full relative border-r border-gray-300">
                    {hourEntries[hour].map((entry, idx) => (
                      entry.status === 'DR' && (
                        <div 
                          key={idx}
                          className="absolute top-0 left-0 h-full bg-red-100"
                          style={{ width: `${entry.percentage * 100}%` }}
                        ></div>
                      )
                    ))}
                  </div>
                ))}
              </div>
              <div className="h-8 flex">
                {hours.map((hour) => (
                  <div key={`on-${hour}`} className="w-10 h-full relative border-r border-gray-300">
                    {hourEntries[hour].map((entry, idx) => (
                      entry.status === 'ON' && (
                        <div 
                          key={idx}
                          className="absolute top-0 left-0 h-full bg-green-100"
                          style={{ width: `${entry.percentage * 100}%` }}
                        ></div>
                      )
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!logs || logs.length === 0) {
    return (
      <Card className="w-full glass-panel">
        <CardHeader>
          <CardTitle className="text-xl">ELD Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted" />
            <p>No ELD logs available yet.</p>
            <p className="text-sm mt-2">Plan a trip to generate ELD logs.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full glass-panel">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">ELD Daily Logs</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={activeTabIndex === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={activeTabIndex === logs.length - 1}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={String(activeTabIndex)} onValueChange={(v) => setActiveTabIndex(parseInt(v))}>
          <TabsList className="w-full justify-start mb-4 overflow-x-auto pb-1 flex-nowrap">
            {logs.map((log, index) => (
              <TabsTrigger
                key={index}
                value={String(index)}
                className="whitespace-nowrap"
              >
                {formatDate(log.date)}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {logs.map((log, index) => (
            <TabsContent key={index} value={String(index)} className="m-0">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total Driving Hours</div>
                    <div className="text-xl font-semibold">{log.totalDrivingHours.toFixed(1)} hrs</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Remaining Driving Hours</div>
                    <div className="text-xl font-semibold">{log.remainingDrivingHours.toFixed(1)} hrs</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total On-Duty Hours</div>
                    <div className="text-xl font-semibold">{log.totalOnDutyHours.toFixed(1)} hrs</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Remaining On-Duty Hours</div>
                    <div className="text-xl font-semibold">{log.remainingOnDutyHours.toFixed(1)} hrs</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-1">Daily Log Sheet</div>
                  {renderEldGrid(log)}
                </div>
                
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-200"></div>
                    <span className="text-xs">Off Duty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-100"></div>
                    <span className="text-xs">Sleeper Berth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-100"></div>
                    <span className="text-xs">Driving</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-100"></div>
                    <span className="text-xs">On Duty (Not Driving)</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-2">Log Entries</div>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="py-2 px-3 text-left font-medium text-muted-foreground">Time</th>
                            <th className="py-2 px-3 text-left font-medium text-muted-foreground">Status</th>
                            <th className="py-2 px-3 text-left font-medium text-muted-foreground">Location</th>
                            <th className="py-2 px-3 text-left font-medium text-muted-foreground">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {log.entries.map((entry, entryIndex) => (
                            <tr 
                              key={entryIndex} 
                              className={`${entryIndex % 2 === 0 ? 'bg-white' : 'bg-muted/20'} border-t border-gray-200`}
                            >
                              <td className="py-2 px-3 align-top">{formatTime(entry.time)}</td>
                              <td className="py-2 px-3 align-top">
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(entry.status)}`}></div>
                                  <span>{getStatusLabel(entry.status)}</span>
                                </div>
                              </td>
                              <td className="py-2 px-3 align-top">{entry.location}</td>
                              <td className="py-2 px-3 align-top text-muted-foreground">{entry.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-2 border-t">
        <Button 
          variant="outline" 
          size="sm"
          className="flex gap-1.5 text-xs"
          onClick={() => handleCopyLog(logs[activeTabIndex])}
        >
          <Clipboard className="h-3.5 w-3.5" />
          <span>Copy Log</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="flex gap-1.5 text-xs"
          onClick={() => handleEditLog(logs[activeTabIndex])}
        >
          <Edit className="h-3.5 w-3.5" />
          <span>Edit Log</span>
        </Button>
        <Button 
          variant="default" 
          size="sm"
          className="flex gap-1.5 text-xs"
          onClick={() => handleDownloadPdf(logs[activeTabIndex])}
        >
          <Download className="h-3.5 w-3.5" />
          <span>Download PDF</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LogSheet;
