
import React, { createContext, useContext, useState, useCallback } from 'react';

export type SolarCommandAction =
  | 'reconstruct'
  | 'focus'
  | 'filter'
  | 'highlight'
  | 'reset'
  | 'recruit';   // recruit: force-load symbols that aren't on screen yet

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

    // For "filter" or "recruit" without explicit action, default to reconstruct
    // so the paginated hook knows to reload the data set
    const normalizedCmd: SolarCoreCommand = {
      ...cmd,
      action: cmd.action ?? 'reconstruct',
    };

    // If category provided, always set action to reconstruct so the
    // SolarSystemSection refreshes the paginated data
    if (cmd.activeCategory && cmd.activeCategory !== 'all' && !cmd.action) {
      normalizedCmd.action = 'reconstruct';
    }

    setCommand(normalizedCmd);
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
