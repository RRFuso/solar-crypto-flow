
import React from 'react';

// Helper function to format market cap values
export function formatValue(value: number): string {
  if (!value) return "N/A";
  
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else {
    return `${value.toFixed(0)}`;
  }
}
