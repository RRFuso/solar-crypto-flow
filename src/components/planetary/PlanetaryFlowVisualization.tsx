
import React, { useRef, useEffect, useState } from 'react';
import { useThree } from '@/hooks/useThree';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const PlanetaryFlowVisualization: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { init, animate } = useThree();

  const [currentView, setCurrentView] = useState<'3d' | 'top' | 'front'>('3d');
  const [flowIntensity, setFlowIntensity] = useState([50]);
  const [rotationSpeed, setRotationSpeed] = useState([50]);

  useEffect(() => {
    if (!containerRef.current) return;
    const { cleanup } = init(containerRef.current);
    animate();

    return () => cleanup();
  }, [init, animate]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.dataset.view = currentView;
    }
  }, [currentView]);

  return (
    <Card className="col-span-1 md:col-span-3 bg-black border border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-gray-200">
              Planetary Capital Flow Model
            </CardTitle>
            <Badge variant="outline" className="bg-gray-800/60 text-yellow-400 border-yellow-400/20">
              Live
            </Badge>
          </div>

          <Tabs value={currentView} onValueChange={(val: any) => setCurrentView(val)} className="w-[220px]">
            <TabsList className="bg-gray-800/60">
              <TabsTrigger value="3d" className="text-xs data-[state=active]:bg-gray-700">3D</TabsTrigger>
              <TabsTrigger value="top" className="text-xs data-[state=active]:bg-gray-700">Top</TabsTrigger>
              <TabsTrigger value="front" className="text-xs data-[state=active]:bg-gray-700">Front</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent>
        <div ref={containerRef} className="relative bg-black rounded-md overflow-hidden h-[500px] shadow-inner">
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md p-3 rounded-lg text-xs text-gray-300 border border-gray-800">
            <p>BTC Dominance: <span className="text-yellow-400 font-mono">58.53%</span></p>
            <p>Inflow (24h): <span className="text-green-400 font-mono">+$1.8B</span></p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap justify-between gap-6 p-3 bg-gray-900/50 rounded-md">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-1/3">
              <Label htmlFor="flow-intensity" className="text-xs text-gray-400 w-32 shrink-0">Flow Intensity</Label>
              <Slider
                id="flow-intensity"
                value={flowIntensity}
                onValueChange={setFlowIntensity}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-gray-400 w-10 text-right">{flowIntensity[0]}%</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-1/3">
              <Label htmlFor="rotation-speed" className="text-xs text-gray-400 w-32 shrink-0">Rotation Speed</Label>
              <Slider
                id="rotation-speed"
                value={rotationSpeed}
                onValueChange={setRotationSpeed}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-gray-400 w-10 text-right">{rotationSpeed[0]}%</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-1/3">
              <Label htmlFor="time-period" className="text-xs text-gray-400 w-32 shrink-0">Time Period</Label>
              <select
                id="time-period"
                className="bg-gray-800 text-xs text-gray-300 rounded-md border-none p-1 w-full"
                defaultValue="24h"
              >
                <option value="1h">1 Hour</option>
                <option value="6h">6 Hours</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-gray-400 justify-between">
            <Legend color="bg-yellow-800" label="BTC (Black Hole)" pulse />
            <Legend color="bg-purple-400" label="Layer 1 Cryptos" />
            <Legend color="bg-blue-400" label="Ecosystem Tokens" />
            <Legend color="bg-green-400" label="Capital Inflow" />
            <Legend color="bg-red-400" label="Capital Outflow" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Legend: React.FC<{ color: string; label: string; pulse?: boolean }> = ({ color, label, pulse }) => (
  <div className="flex items-center gap-2">
    <div className={`relative w-3 h-3 rounded-full ${pulse ? 'flex items-center justify-center' : color}`}>
      {pulse ? (
        <>
          <div className="h-2 w-2 rounded-full bg-gray-800 shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
          <div className="absolute h-3 w-3 animate-ping rounded-full bg-yellow-800 opacity-75" />
        </>
      ) : null}
    </div>
    <span>{label}</span>
  </div>
);

export default PlanetaryFlowVisualization;
