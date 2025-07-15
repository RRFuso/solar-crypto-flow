export interface BaseNode {
  id: string;
  name: string;
  value: number;
  x: number;
  y: number;
  radius: number;
  fx: number | null;
  fy: number | null;
}