
import React, { useRef, useEffect, useState } from 'react';
import { useThree } from '@/hooks/useThree';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const PlanetaryFlowVisualization = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { init, animate } = useThree();
  const [currentView, setCurrentView] = useState("3d");
  const [flowIntensity, setFlowIntensity] = useState([50]);
  const [rotationSpeed, setRotationSpeed] = useState([50]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const { cleanup } = init(containerRef.current);
    animate();
    
    return () => {
      cleanup();
    };
  }, [init, animate]);

  // Handle camera view changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Apply camera position based on selected view
    // This would normally interact with the Three.js camera
    // For demonstration, we're just adding a class
    container.dataset.view = currentView;
  }, [currentView]);

  return (
    <Card className="col-span-1 md:col-span-3 bg-black border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CardTitle className="text-gray-200">Planetary Capital Flow Model</CardTitle>
            <Badge variant="outline" className="bg-gray-800/60 text-yellow-400 border-yellow-400/20">
              Live
            </Badge>
          </div>
          
          <Tabs defaultValue="3d" className="w-[200px]" value={currentView} onValueChange={setCurrentView}>
            <TabsList className="bg-gray-800/60">
              <TabsTrigger value="3d" className="text-xs data-[state=active]:bg-gray-700">3D View</TabsTrigger>
              <TabsTrigger value="top" className="text-xs data-[state=active]:bg-gray-700">Top View</TabsTrigger>
              <TabsTrigger value="front" className="text-xs data-[state=active]:bg-gray-700">Front View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative bg-black rounded-md overflow-hidden h-[500px] shadow-inner" ref={containerRef}>
          {/* Three.js will render here */}
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg text-xs text-gray-300 border border-gray-800">
            <p>BTC Market Dominance: <span className="text-yellow-400 font-mono">58.53%</span></p>
            <p>Capital Inflow (24h): <span className="text-green-400 font-mono">+$1.8B</span></p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-4 mt-4">
          <div className="flex justify-between items-center gap-6 p-2 bg-gray-900/50 rounded-md">
            <div className="flex items-center gap-2 w-1/3">
              <Label htmlFor="flow-intensity" className="text-xs text-gray-400 w-32">Flow Intensity</Label>
              <Slider 
                id="flow-intensity"
                value={flowIntensity} 
                onValueChange={setFlowIntensity}
                max={100} 
                step={1}
                className="w-full"
              />
              <span className="text-xs text-gray-400 w-8">{flowIntensity}%</span>
            </div>
            
            <div className="flex items-center gap-2 w-1/3">
              <Label htmlFor="rotation-speed" className="text-xs text-gray-400 w-32">Rotation Speed</Label>
              <Slider 
                id="rotation-speed"
                value={rotationSpeed} 
                onValueChange={setRotationSpeed}
                max={100} 
                step={1}
                className="w-full"
              />
              <span className="text-xs text-gray-400 w-8">{rotationSpeed}%</span>
            </div>
            
            <div className="flex items-center gap-2 w-1/3">
              <Label htmlFor="time-period" className="text-xs text-gray-400 w-32">Time Period</Label>
              <select 
                id="time-period"
                className="bg-gray-800 border-none text-xs rounded-md text-gray-300 p-1 w-full"
                defaultValue="24h"
              >
                <option value="1h">1 Hour</option>
                <option value="6h">6 Hours</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="flex h-3 w-3 items-center justify-center rounded-full">
                <div className="h-2 w-2 rounded-full bg-gray-800 shadow-[0_0_8px_rgba(0,0,0,0.8)]"></div>
                <div className="absolute h-3 w-3 animate-ping rounded-full bg-yellow-800 opacity-75"></div>
              </div>
              <span>BTC (Black Hole)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-400"></div>
              <span>Layer 1 Cryptos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span>Ecosystem Tokens</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span>Capital Inflow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span>Capital Outflow</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanetaryFlowVisualization;
