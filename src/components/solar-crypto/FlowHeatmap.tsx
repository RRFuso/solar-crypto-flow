
import React, { useState, useEffect } from 'react';
import { ResponsiveHeatMap } from '@nivo/heatmap';

interface HeatmapData {
  id: string;
  data: Array<{
    x: string;
    y: number;
  }>;
}

interface FlowHeatmapProps {
  data?: Array<any>;
  title?: string;
}

const FlowHeatmap: React.FC<FlowHeatmapProps> = ({ 
  data = [],
  title = "Heatmap de Fluxos" 
}) => {
  const [formattedData, setFormattedData] = useState<HeatmapData[]>([]);
  
  useEffect(() => {
    if (!data || data.length === 0) {
      // Sample data for visualization
      const sampleData: HeatmapData[] = [
        {
          id: 'BTC',
          data: [
            { x: 'Jan', y: 20 },
            { x: 'Fev', y: 32 },
            { x: 'Mar', y: 14 },
            { x: 'Abr', y: 45 },
            { x: 'Mai', y: 32 },
            { x: 'Jun', y: 23 },
          ]
        },
        {
          id: 'ETH',
          data: [
            { x: 'Jan', y: 15 },
            { x: 'Fev', y: 27 },
            { x: 'Mar', y: 39 },
            { x: 'Abr', y: 20 },
            { x: 'Mai', y: 12 },
            { x: 'Jun', y: 35 },
          ]
        },
        {
          id: 'SOL',
          data: [
            { x: 'Jan', y: 5 },
            { x: 'Fev', y: 52 },
            { x: 'Mar', y: 44 },
            { x: 'Abr', y: 29 },
            { x: 'Mai', y: 16 },
            { x: 'Jun', y: 10 },
          ]
        }
      ];
      setFormattedData(sampleData);
    } else {
      // Format real data here when available
      // This would depend on the structure of your data
      setFormattedData([]);
    }
  }, [data]);

  return (
    <div className="w-full h-[300px]">
      <div className="mb-2 text-lg font-medium">{title}</div>
      {formattedData.length > 0 ? (
        <ResponsiveHeatMap
          data={formattedData}
          margin={{ top: 10, right: 90, bottom: 60, left: 60 }}
          valueFormat=">-.2s"
          axisTop={null}
          axisRight={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: '',
            legendPosition: 'middle',
            legendOffset: 70
          }}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: '',
            legendPosition: 'middle',
            legendOffset: 36
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Crypto',
            legendPosition: 'middle',
            legendOffset: -40
          }}
          colors={{
            type: 'diverging',
            scheme: 'yellow_orange_red',
            divergeAt: 0.5,
            minValue: 0,
            maxValue: 100
          }}
          emptyColor="#555555"
          legends={[
            {
              anchor: 'bottom',
              translateX: 0,
              translateY: 30,
              length: 400,
              thickness: 8,
              direction: 'row',
              tickPosition: 'after',
              tickSize: 3,
              tickSpacing: 4,
              tickOverlap: false,
              tickFormat: '>-.2s',
              title: 'Valor →',
              titleAlign: 'start',
              titleOffset: 4
            }
          ]}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          Sem dados disponíveis para o heatmap
        </div>
      )}
    </div>
  );
};

export default FlowHeatmap;
