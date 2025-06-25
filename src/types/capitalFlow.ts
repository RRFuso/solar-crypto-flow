
export interface CapitalFlowNode {
  id: string;
  value: number;
  radius?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface CapitalFlowLink {
  source: CapitalFlowNode;
  target: CapitalFlowNode;
  value: number;
  percentage: number;
}
