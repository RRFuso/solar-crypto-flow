import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface CryptoSettingsProps {
  settings: {
    rsiOverbought: number;
    rsiOversold: number;
    rsiNeutralMin: number;
    rsiNeutralMax: number;
    timeframe: string;
  };
  onSettingsChange: (settings: any) => void;
}

const CryptoSettings = ({ settings, onSettingsChange }: CryptoSettingsProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings2 className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Configurações</SheetTitle>
          <SheetDescription>
            Ajuste os parâmetros dos indicadores técnicos
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Timeframe</Label>
            <Select 
              value={settings.timeframe}
              onValueChange={(value) => 
                onSettingsChange({ ...settings, timeframe: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15m">15 minutos</SelectItem>
                <SelectItem value="1h">1 hora</SelectItem>
                <SelectItem value="4h">4 horas</SelectItem>
                <SelectItem value="1d">1 dia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>RSI Sobrecompra ({settings.rsiOverbought})</Label>
            <Slider
              value={[settings.rsiOverbought]}
              min={60}
              max={90}
              step={1}
              onValueChange={([value]) => 
                onSettingsChange({ ...settings, rsiOverbought: value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>RSI Sobrevenda ({settings.rsiOversold})</Label>
            <Slider
              value={[settings.rsiOversold]}
              min={10}
              max={40}
              step={1}
              onValueChange={([value]) => 
                onSettingsChange({ ...settings, rsiOversold: value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>RSI Neutro Min-Max ({settings.rsiNeutralMin}-{settings.rsiNeutralMax})</Label>
            <Slider
              value={[settings.rsiNeutralMin, settings.rsiNeutralMax]}
              min={40}
              max={60}
              step={1}
              onValueChange={([min, max]) => 
                onSettingsChange({ 
                  ...settings, 
                  rsiNeutralMin: min,
                  rsiNeutralMax: max 
                })
              }
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CryptoSettings;