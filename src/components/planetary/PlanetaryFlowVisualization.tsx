
import React, { useRef, useEffect } from 'react';
import { useThree } from '@/hooks/useThree';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PlanetaryFlowVisualization = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { init, animate } = useThree();

  useEffect(() => {
    if (!containerRef.current) return;
    
    const { cleanup } = init(containerRef.current);
    animate();
    
    return () => {
      cleanup();
    };
  }, [init, animate]);

  return (
    <Card className="col-span-1 md:col-span-3 bg-black">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-gray-200">Planetary Capital Flow Model</CardTitle>
          
          <Tabs defaultValue="3d" className="w-[200px]">
            <TabsList className="bg-gray-800/60">
              <TabsTrigger value="3d" className="text-xs">3D View</TabsTrigger>
              <TabsTrigger value="top" className="text-xs">Top View</TabsTrigger>
              <TabsTrigger value="front" className="text-xs">Front View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative bg-black rounded-md overflow-hidden h-[500px]" ref={containerRef}>
          {/* Three.js will render here */}
        </div>
        
        <div className="flex justify-between mt-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white"></div>
            <span>BTC (Black Hole)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
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
      </CardContent>
    </Card>
  );
};

export default PlanetaryFlowVisualization;
