import { useState, useEffect } from 'react';

interface PredatorState {
  id: string;
  size: number;
  isEating: boolean;
  target?: string;
}

export const usePredatorLogic = (cryptos: Array<{ id: string; performance: number }>) => {
  const [predatorStates, setPredatorStates] = useState<Record<string, PredatorState>>({});
  const [removedCryptos, setRemovedCryptos] = useState<string[]>([]);

  const calculateSize = (performance: number) => {
    const minSize = 48;
    const maxSize = 144;
    return Math.abs(Math.max(minSize, Math.min(maxSize, (performance / 100) * maxSize)));
  };

  useEffect(() => {
    // Initialize predator states
    const initialStates: Record<string, PredatorState> = {};
    cryptos.forEach(crypto => {
      initialStates[crypto.id] = {
        id: crypto.id,
        size: calculateSize(crypto.performance),
        isEating: false
      };
    });
    setPredatorStates(initialStates);
  }, []);

  const checkPredation = () => {
    const newStates = { ...predatorStates };
    const newRemovedCryptos = [...removedCryptos];

    cryptos.forEach(predator => {
      if (newRemovedCryptos.includes(predator.id)) return;

      cryptos.forEach(prey => {
        if (
          predator.id !== prey.id &&
          !newRemovedCryptos.includes(prey.id) &&
          !newStates[predator.id]?.isEating &&
          !newStates[prey.id]?.isEating
        ) {
          const predatorSize = calculateSize(predator.performance);
          const preySize = calculateSize(prey.performance);

          if (predatorSize > preySize * 1.2) {
            newStates[predator.id] = {
              ...newStates[predator.id],
              isEating: true,
              target: prey.id,
              size: predatorSize + (preySize * 0.2)
            };
            newRemovedCryptos.push(prey.id);
          }
        }
      });
    });

    setPredatorStates(newStates);
    setRemovedCryptos(newRemovedCryptos);
  };

  const resetTank = () => {
    setPredatorStates({});
    setRemovedCryptos([]);
  };

  return {
    predatorStates,
    removedCryptos,
    checkPredation,
    resetTank
  };
};