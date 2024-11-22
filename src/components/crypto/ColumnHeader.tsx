import React from 'react';
import { cn } from "@/lib/utils";

interface ColumnHeaderProps {
  title: string;
  subtitle: string;
  className?: string;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({ title, subtitle, className }) => {
  return (
    <div className={cn("p-4 border-b border-gray-800", className)}>
      <h3 className="font-bold text-sm">{title}</h3>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
};