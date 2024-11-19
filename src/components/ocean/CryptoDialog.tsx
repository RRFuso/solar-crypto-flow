import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CryptoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crypto: {
    name: string;
    id: string;
    performance: number;
  } | null;
}

export const CryptoDialog = ({ open, onOpenChange, crypto }: CryptoDialogProps) => {
  if (!crypto) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {crypto.name} ({crypto.id})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Performance vs BTC:</span>
            <span className={crypto.performance >= 0 ? 'text-green-400' : 'text-red-400'}>
              {crypto.performance.toFixed(2)}%
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};