import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EldDailyLog } from '@/utils/eldUtils';
import { Download, Save, Undo, Eraser, Pencil, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DailyLogEditorProps {
  log: EldDailyLog;
  onSave?: (image: string) => void;
  onClose?: () => void;
}

const DailyLogEditor: React.FC<DailyLogEditorProps> = ({ log, onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [tool, setTool] = useState<'draw' | 'erase'>('draw');
  const [color, setColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(2);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'numeric', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Initialize fabric canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvas) return;
    
    // Calculate dimensions based on container width
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = 600; // Fixed height or responsive calculation
    
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: containerWidth,
      height: containerHeight,
      isDrawingMode: true,
      backgroundColor: '#ffffff',
    });
    
    // Set initial brush
    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = brushSize;
    
    // Load the ELD log template image
    fabric.Image.fromURL('/lovable-uploads/7a895491-8b8b-4fc6-9e06-42f572199ea0.png', function(img) {
      img.scaleToWidth(canvas.getWidth());
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
        originX: 'left',
        originY: 'top',
      });
    });
    
    setFabricCanvas(canvas);
    
    // Cleanup
    return () => {
      canvas.dispose();
    };
  }, [canvasRef.current]);
  
  // Update brush when tool, color or size changes
  useEffect(() => {
    if (!fabricCanvas) return;
    
    fabricCanvas.isDrawingMode = true;
    
    if (tool === 'draw') {
      fabricCanvas.freeDrawingBrush.color = color;
      fabricCanvas.freeDrawingBrush.width = brushSize;
    } else if (tool === 'erase') {
      fabricCanvas.freeDrawingBrush.color = '#ffffff';
      fabricCanvas.freeDrawingBrush.width = brushSize * 2;
    }
  }, [tool, color, brushSize, fabricCanvas]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!fabricCanvas || !containerRef.current) return;
      
      const newWidth = containerRef.current.clientWidth;
      fabricCanvas.setWidth(newWidth);
      
      // Resize background image
      if (fabricCanvas.backgroundImage) {
        const bgImg = fabricCanvas.backgroundImage as fabric.Image;
        bgImg.scaleToWidth(newWidth);
        fabricCanvas.renderAll();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [fabricCanvas]);
  
  const handleClear = () => {
    if (!fabricCanvas) return;
    
    // Clear all objects but keep the background
    const backgroundImage = fabricCanvas.backgroundImage;
    fabricCanvas.clear();
    fabricCanvas.setBackgroundImage(backgroundImage as fabric.Image, fabricCanvas.renderAll.bind(fabricCanvas));
    toast({
      title: "Canvas cleared",
      description: "All drawings have been cleared",
    });
  };
  
  const handleUndo = () => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    if (objects.length > 0) {
      fabricCanvas.remove(objects[objects.length - 1]);
      fabricCanvas.renderAll();
    }
  };
  
  const handleSave = () => {
    if (!fabricCanvas) return;
    
    // Get data URL of the canvas
    const dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 0.8
    });
    
    if (onSave) {
      onSave(dataUrl);
    }
    
    toast({
      title: "Log saved",
      description: "Your log has been saved successfully",
    });
  };
  
  const handleDownload = () => {
    if (!fabricCanvas) return;
    
    // Get data URL and create download link
    const dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 0.8
    });
    
    const link = document.createElement('a');
    link.download = `ELD_Log_${formatDate(log.date).replace(/\//g, '-')}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Log downloaded",
      description: "Your log has been downloaded as an image",
    });
  };
  
  // Pre-fill some data based on the log
  useEffect(() => {
    if (!fabricCanvas) return;
    
    // Convert date to MM/DD/YYYY format
    const date = new Date(log.date);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // Add date text
    const dateText = new fabric.Text(`${month}/${day}/${year}`, {
      left: 261,
      top: 25,
      fontSize: 12,
      fontFamily: 'Arial'
    });
    
    // Add total driving hours
    const drivingHoursText = new fabric.Text(log.totalDrivingHours.toFixed(1), {
      left: 95,
      top: 95,
      fontSize: 12,
      fontFamily: 'Arial'
    });
    
    fabricCanvas.add(dateText, drivingHoursText);
    fabricCanvas.renderAll();
  }, [fabricCanvas, log]);
  
  return (
    <Card className="w-full glass-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            Edit Daily Log - {formatDate(log.date)}
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4 mr-1" />
              Close Editor
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={tool === 'draw' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTool('draw')}
              className="flex gap-1"
            >
              <Pencil className="h-4 w-4" />
              Draw
            </Button>
            <Button 
              variant={tool === 'erase' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTool('erase')}
              className="flex gap-1"
            >
              <Eraser className="h-4 w-4" />
              Erase
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleUndo}
              className="flex gap-1"
            >
              <Undo className="h-4 w-4" />
              Undo
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClear}
              className="flex gap-1 ml-auto"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
          
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-sm font-medium block mb-1">Color</label>
              <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                className="w-10 h-10 rounded cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium block mb-1">Brush Size: {brushSize}px</label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={brushSize} 
                onChange={(e) => setBrushSize(parseInt(e.target.value))} 
                className="w-full"
              />
            </div>
          </div>
          
          <div 
            ref={containerRef} 
            className="border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          >
            <canvas ref={canvasRef} />
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Use the drawing tools to fill out the log sheet. You can draw on the grid to indicate driving times, rest periods, etc.</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-4 border-t">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleDownload}
          className="flex gap-1.5"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
        <Button 
          variant="default" 
          size="sm"
          onClick={handleSave}
          className="flex gap-1.5"
        >
          <Save className="h-4 w-4" />
          Save Log
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DailyLogEditor;
