
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMarketRotationData } from '@/lib/marketIndicesData';
import { IndexRotationResult } from '@/types/indices';

export function useMarketRotation(period: string = '7d') {
  return useQuery({
    queryKey: ['market-rotation', period],
    queryFn: () => fetchMarketRotationData(period),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
    meta: {
      onError: (error: Error) => {
        console.error('Failed to fetch market rotation data:', error);
      }
    }
  });
}
