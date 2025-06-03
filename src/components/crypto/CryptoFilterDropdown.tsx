
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
    { value: 'outperforming', label: 'Destaques' },
    { value: 'bullish', label: 'Alta' },
    { value: 'bearish', label: 'Baixa' },
    { value: 'overbought', label: 'Sobrecomprado' },
    { value: 'oversold', label: 'Sobrevendido' },
    { value: 'div-bull', label: 'Divergência Bull' },
    { value: 'div-bear', label: 'Divergência Bear' },
  ];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-48 bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700/50 transition-colors">
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
