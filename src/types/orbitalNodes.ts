import { OrbitalNode } from '@/components/capital-flow/NodePlacement';
import { PriceActionSignal } from '@/hooks/usePriceActionSignals';
import { AIInsight } from '@/hooks/useAdvancedAI';
import { CapitalFlowLink } from '@/types/capitalFlow';

export interface ExtendedOrbitalNode extends OrbitalNode {
  price?: string;  // Changed back to string to match existing usage
  volume?: number | undefined;
  priceChange24h?: number;
  priceActionSignal?: PriceActionSignal;
  name: string;
  value: number;
  color: string;
  tokens: string[];
  fx: number | null;
  fy: number | null;
  capitalFlows?: CapitalFlowLink[];
  aiModel?: AIInsight;
}