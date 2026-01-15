import { useEffect, useRef, useState, useCallback } from 'react';

interface FlowData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
  flowDirection?: 'inflow' | 'outflow' | 'neutral';
  flowIntensity?: number;
}

interface ProcessingStats {
  totalProcessed: number;
  inflowCount: number;
  outflowCount: number;
  processingTime: number;
}

interface ProcessingOptions {
  category?: string;
  limit?: number;
  minVolume?: number;
}

export const useCapitalFlowWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastStats, setLastStats] = useState<ProcessingStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingResolve = useRef<((data: FlowData[]) => void) | null>(null);
  const pendingReject = useRef<((error: Error) => void) | null>(null);

  // Initialize worker
  useEffect(() => {
    try {
      workerRef.current = new Worker(
        new URL('../workers/capitalFlowWorker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (event) => {
        const { type, data, stats, error: workerError } = event.data;

        if (type === 'processed') {
          setIsProcessing(false);
          setLastStats(stats);
          setError(null);
          pendingResolve.current?.(data);
        } else if (type === 'error') {
          setIsProcessing(false);
          setError(workerError);
          pendingReject.current?.(new Error(workerError));
        }
      };

      workerRef.current.onerror = (event) => {
        setIsProcessing(false);
        setError(event.message);
        pendingReject.current?.(new Error(event.message));
      };

      // Test worker is responsive
      workerRef.current.postMessage({ type: 'ping' });
    } catch (err) {
      console.warn('Web Worker not supported, falling back to main thread');
      setError('Web Workers not supported');
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Process data using worker
  const processData = useCallback(
    (rawData: FlowData[], options: ProcessingOptions = {}): Promise<FlowData[]> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          // Fallback to main thread processing
          const processed = rawData.slice(0, options.limit || 50);
          resolve(processed);
          return;
        }

        setIsProcessing(true);
        pendingResolve.current = resolve;
        pendingReject.current = reject;

        workerRef.current.postMessage({
          type: 'process',
          payload: { data: rawData, options },
        });
      });
    },
    []
  );

  // Check if worker is available
  const isWorkerAvailable = workerRef.current !== null;

  return {
    processData,
    isProcessing,
    isWorkerAvailable,
    lastStats,
    error,
  };
};
