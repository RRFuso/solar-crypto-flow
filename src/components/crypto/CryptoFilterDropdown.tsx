import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CryptoFilterDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
}

const CryptoFilterDropdown: React.FC<CryptoFilterDropdownProps> = ({ value, onValueChange }) => {
  const filterOptions = [
    { value: 'outperforming', label: '🚀 Destaques vs BTC' },
    { value: 'bullish', label: '🐂 Tendência de Alta' },
    { value: 'bearish', label: '🐻 Tendência de Baixa' },
    { value: 'overbought', label: '📈 Sobrecomprado (RSI >70)' },
    { value: 'oversold', label: '📉 Sobrevendido (RSI <30)' },
    { value: 'div-bull', label: '🔄 Divergência Bullish' },
    { value: 'div-bear', label: '🔄 Divergência Bearish' },
  ];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700/50 transition-colors">
        <SelectValue placeholder="Selecionar filtro" />
      </SelectTrigger>
      <SelectContent className="bg-gray-900 border-gray-700">
        {filterOptions.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="text-white hover:bg-gray-700 focus:bg-gray-700"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CryptoFilterDropdown;