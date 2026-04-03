
import React, { createContext, useContext, useState, useCallback } from 'react';

export type SolarCommandAction = 'reconstruct' | 'focus' | 'filter' | 'highlight' | 'reset';

export interface SolarCoreCommand {
  action?: SolarCommandAction;
  selectedSymbols?: string[];
  highlightedFlows?: any[];
  activeCategory?: string;
  zoomLevel?: number;
  smartMoneyThreshold?: number;
  focusNodeId?: string | null;
  particleColor?: string;
}

interface SolarCoreCommandContextType {
  command: SolarCoreCommand | null;
  applyHeliusCommand: (cmd: SolarCoreCommand) => void;
  clearCommand: () => void;
  // Bidirectional: node click → Oracle
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}

const SolarCoreCommandContext = createContext<SolarCoreCommandContextType>({
  command: null,
  applyHeliusCommand: () => {},
  clearCommand: () => {},
  selectedNodeId: null,
  setSelectedNodeId: () => {},
});

export const useSolarCoreCommand = () => useContext(SolarCoreCommandContext);

export const SolarCoreCommandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [command, setCommand] = useState<SolarCoreCommand | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const applyHeliusCommand = useCallback((cmd: SolarCoreCommand) => {
    console.log('[SolarCore] Command received:', cmd);
    setCommand(cmd);
  }, []);

  const clearCommand = useCallback(() => {
    setCommand(null);
  }, []);

  return (
    <SolarCoreCommandContext.Provider value={{
      command,
      applyHeliusCommand,
      clearCommand,
      selectedNodeId,
      setSelectedNodeId,
    }}>
      {children}
    </SolarCoreCommandContext.Provider>
  );
};
