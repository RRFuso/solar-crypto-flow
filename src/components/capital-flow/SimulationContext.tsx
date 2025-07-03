import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { OrbitalNode } from './NodePlacement';
import { FlowData } from '@/types/crypto';
import { Prediction } from '@/lib/aiModel';

interface SimulationState {
  nodes: OrbitalNode[];
  centralNode: OrbitalNode | null;
  isAnimating: boolean;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  zoomLevel: number;
  rotationSpeed: number;
  showLines: boolean;
  dimensions: { width: number; height: number };
}

type SimulationAction =
  | { type: 'SET_NODES'; payload: { nodes: OrbitalNode[]; centralNode: OrbitalNode | null } }
  | { type: 'START_ANIMATION' }
  | { type: 'STOP_ANIMATION' }
  | { type: 'SELECT_NODE'; payload: string | null }
  | { type: 'HOVER_NODE'; payload: string | null }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_ROTATION_SPEED'; payload: number }
  | { type: 'TOGGLE_LINES'; payload: boolean }
  | { type: 'SET_DIMENSIONS'; payload: { width: number; height: number } }
  | { type: 'UPDATE_NODE_POSITIONS'; payload: OrbitalNode[] };

const initialState: SimulationState = {
  nodes: [],
  centralNode: null,
  isAnimating: false,
  selectedNodeId: null,
  hoveredNodeId: null,
  zoomLevel: 70,
  rotationSpeed: 0.0001,
  showLines: true,
  dimensions: { width: 800, height: 600 }
};

function simulationReducer(state: SimulationState, action: SimulationAction): SimulationState {
  switch (action.type) {
    case 'SET_NODES':
      return {
        ...state,
        nodes: action.payload.nodes,
        centralNode: action.payload.centralNode
      };
    case 'START_ANIMATION':
      return { ...state, isAnimating: true };
    case 'STOP_ANIMATION':
      return { ...state, isAnimating: false };
    case 'SELECT_NODE':
      return { ...state, selectedNodeId: action.payload };
    case 'HOVER_NODE':
      return { ...state, hoveredNodeId: action.payload };
    case 'SET_ZOOM':
      return { ...state, zoomLevel: action.payload };
    case 'SET_ROTATION_SPEED':
      return { ...state, rotationSpeed: action.payload };
    case 'TOGGLE_LINES':
      return { ...state, showLines: action.payload };
    case 'SET_DIMENSIONS':
      return { ...state, dimensions: action.payload };
    case 'UPDATE_NODE_POSITIONS':
      return { ...state, nodes: action.payload };
    default:
      return state;
  }
}

interface SimulationContextType {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationAction>;
  actions: {
    setNodes: (nodes: OrbitalNode[], centralNode: OrbitalNode | null) => void;
    startAnimation: () => void;
    stopAnimation: () => void;
    selectNode: (nodeId: string | null) => void;
    hoverNode: (nodeId: string | null) => void;
    setZoom: (level: number) => void;
    setRotationSpeed: (speed: number) => void;
    toggleLines: (show: boolean) => void;
    setDimensions: (dimensions: { width: number; height: number }) => void;
    updateNodePositions: (nodes: OrbitalNode[]) => void;
  };
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};

interface SimulationProviderProps {
  children: React.ReactNode;
  flowData?: FlowData[];
  predictions?: Prediction[];
}

export const SimulationProvider: React.FC<SimulationProviderProps> = ({ 
  children,
  flowData = [],
  predictions = []
}) => {
  const [state, dispatch] = useReducer(simulationReducer, initialState);

  // Actions
  const actions = {
    setNodes: (nodes: OrbitalNode[], centralNode: OrbitalNode | null) => {
      dispatch({ type: 'SET_NODES', payload: { nodes, centralNode } });
    },
    startAnimation: () => dispatch({ type: 'START_ANIMATION' }),
    stopAnimation: () => dispatch({ type: 'STOP_ANIMATION' }),
    selectNode: (nodeId: string | null) => dispatch({ type: 'SELECT_NODE', payload: nodeId }),
    hoverNode: (nodeId: string | null) => dispatch({ type: 'HOVER_NODE', payload: nodeId }),
    setZoom: (level: number) => dispatch({ type: 'SET_ZOOM', payload: level }),
    setRotationSpeed: (speed: number) => dispatch({ type: 'SET_ROTATION_SPEED', payload: speed }),
    toggleLines: (show: boolean) => dispatch({ type: 'TOGGLE_LINES', payload: show }),
    setDimensions: (dimensions: { width: number; height: number }) => {
      dispatch({ type: 'SET_DIMENSIONS', payload: dimensions });
    },
    updateNodePositions: (nodes: OrbitalNode[]) => {
      dispatch({ type: 'UPDATE_NODE_POSITIONS', payload: nodes });
    }
  };

  // Orbital animation effect
  useEffect(() => {
    if (!state.isAnimating || state.nodes.length === 0) return;

    let animationFrameId: number;

    const animate = () => {
      const { nodes, centralNode, rotationSpeed, dimensions } = state;
      
      if (!centralNode) return;

      const updatedNodes = nodes.map(node => {
        if (node.type === 'central') {
          return node;
        }

        // Update orbital position
        const newAngle = (node.angle || 0) + rotationSpeed * (1 + Math.random() * 0.5);
        const orbitRadius = node.orbitRadius || 150;

        return {
          ...node,
          angle: newAngle,
          x: dimensions.width / 2 + Math.cos(newAngle) * orbitRadius,
          y: dimensions.height / 2 + Math.sin(newAngle) * orbitRadius
        };
      });

      actions.updateNodePositions(updatedNodes);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [state.isAnimating, state.nodes.length, state.rotationSpeed, state.dimensions]);

  // Initialize nodes from flow data
  useEffect(() => {
    if (!flowData || flowData.length === 0 || !state.dimensions.width) return;

    const centerX = state.dimensions.width / 2;
    const centerY = state.dimensions.height / 2;

    // Create central node (BTC)
    const centralNode: OrbitalNode = {
      id: 'BTC',
      x: centerX,
      y: centerY,
      radius: 35,
      angle: 0,
      orbitRadius: 0,
      type: 'central',
      marketCap: 1000000
    };

    // Create orbital nodes
    const orbitalNodes: OrbitalNode[] = flowData.slice(0, 12).map((flow, index) => {
      const prediction = predictions.find(p => p.symbol === flow.to || p.symbol === flow.from);
      
      const orbitLayer = Math.floor(index / 6) + 1;
      const nodeInOrbit = index % 6;
      const orbitRadius = 120 + (orbitLayer * 80);
      const angle = (nodeInOrbit / 6) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;

      const symbol = flow.to !== 'BTC' ? flow.to : flow.from;

      return {
        id: symbol || `node-${index}`,
        x: centerX + Math.cos(angle) * orbitRadius,
        y: centerY + Math.sin(angle) * orbitRadius,
        radius: 20,
        angle,
        orbitRadius,
        type: 'orbital' as const,
        marketCap: Math.abs(flow.value) * 1000
      };
    });

    actions.setNodes([centralNode, ...orbitalNodes], centralNode);
    actions.startAnimation();
  }, [flowData, predictions, state.dimensions]);

  return (
    <SimulationContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </SimulationContext.Provider>
  );
};

export default SimulationContext;