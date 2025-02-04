import React from 'react';
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
import { Settings2 } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface CustomizeSettingsProps {
  settings: {
    timeframe: string;
    indicators: {
      ema: { enabled: boolean; periods: number[] };
      rsi: { enabled: boolean; period: number; overbought: number; oversold: number };
      macd: { enabled: boolean; fast: number; slow: number; signal: number };
      bollinger: { enabled: boolean; period: number; stdDev: number };
      volume: { enabled: boolean; period: number };
    };
  };
  onSettingsChange: (settings: any) => void;
}

const CustomizeSettings = ({ settings, onSettingsChange }: CustomizeSettingsProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings2 className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Personalizar Indicadores</SheetTitle>
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
                <SelectItem value="1m">1 minuto</SelectItem>
                <SelectItem value="5m">5 minutos</SelectItem>
                <SelectItem value="15m">15 minutos</SelectItem>
                <SelectItem value="1h">1 hora</SelectItem>
                <SelectItem value="4h">4 horas</SelectItem>
                <SelectItem value="1d">1 dia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>EMA</Label>
              <Switch
                checked={settings.indicators.ema.enabled}
                onCheckedChange={(checked) =>
                  onSettingsChange({
                    ...settings,
                    indicators: {
                      ...settings.indicators,
                      ema: { ...settings.indicators.ema, enabled: checked }
                    }
                  })
                }
              />
            </div>
            {settings.indicators.ema.enabled && (
              <div className="space-y-2">
                <Label>Períodos EMA ({settings.indicators.ema.periods.join(', ')})</Label>
                <Slider
                  value={settings.indicators.ema.periods}
                  min={5}
                  max={200}
                  step={1}
                  onValueChange={(value) =>
                    onSettingsChange({
                      ...settings,
                      indicators: {
                        ...settings.indicators,
                        ema: { ...settings.indicators.ema, periods: value }
                      }
                    })
                  }
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>RSI</Label>
              <Switch
                checked={settings.indicators.rsi.enabled}
                onCheckedChange={(checked) =>
                  onSettingsChange({
                    ...settings,
                    indicators: {
                      ...settings.indicators,
                      rsi: { ...settings.indicators.rsi, enabled: checked }
                    }
                  })
                }
              />
            </div>
            {settings.indicators.rsi.enabled && (
              <>
                <div className="space-y-2">
                  <Label>Período RSI ({settings.indicators.rsi.period})</Label>
                  <Slider
                    value={[settings.indicators.rsi.period]}
                    min={2}
                    max={50}
                    step={1}
                    onValueChange={([value]) =>
                      onSettingsChange({
                        ...settings,
                        indicators: {
                          ...settings.indicators,
                          rsi: { ...settings.indicators.rsi, period: value }
                        }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sobrecompra/Sobrevenda ({settings.indicators.rsi.overbought}/{settings.indicators.rsi.oversold})</Label>
                  <Slider
                    value={[settings.indicators.rsi.oversold, settings.indicators.rsi.overbought]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([oversold, overbought]) =>
                      onSettingsChange({
                        ...settings,
                        indicators: {
                          ...settings.indicators,
                          rsi: { ...settings.indicators.rsi, oversold, overbought }
                        }
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Bollinger Bands</Label>
              <Switch
                checked={settings.indicators.bollinger.enabled}
                onCheckedChange={(checked) =>
                  onSettingsChange({
                    ...settings,
                    indicators: {
                      ...settings.indicators,
                      bollinger: { ...settings.indicators.bollinger, enabled: checked }
                    }
                  })
                }
              />
            </div>
            {settings.indicators.bollinger.enabled && (
              <>
                <div className="space-y-2">
                  <Label>Período ({settings.indicators.bollinger.period})</Label>
                  <Slider
                    value={[settings.indicators.bollinger.period]}
                    min={5}
                    max={50}
                    step={1}
                    onValueChange={([value]) =>
                      onSettingsChange({
                        ...settings,
                        indicators: {
                          ...settings.indicators,
                          bollinger: { ...settings.indicators.bollinger, period: value }
                        }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Desvio Padrão ({settings.indicators.bollinger.stdDev})</Label>
                  <Slider
                    value={[settings.indicators.bollinger.stdDev]}
                    min={1}
                    max={4}
                    step={0.1}
                    onValueChange={([value]) =>
                      onSettingsChange({
                        ...settings,
                        indicators: {
                          ...settings.indicators,
                          bollinger: { ...settings.indicators.bollinger, stdDev: value }
                        }
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CustomizeSettings;