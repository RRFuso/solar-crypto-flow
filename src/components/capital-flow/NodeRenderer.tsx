import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitalNode } from './NodePlacement';
import { getLogoUrls } from '@/lib/cryptoLogos';
import { PriceActionSignal } from '@/hooks/usePriceActionSignals';
import { AIInsight } from '@/hooks/useAdvancedAI';
import { useTooltip } from '@/contexts/TooltipContext';
import { CapitalFlowLink } from '@/types/capitalFlow';

interface ExtendedOrbitalNode extends OrbitalNode {
  priceActionSignal?: PriceActionSignal;
  price?: string;
  priceChange24h?: number;
  capitalFlows?: CapitalFlowLink[];
  aiModel?: AIInsight;
}

interface NodeRendererProps {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;
  nodes: ExtendedOrbitalNode[];
  centralNode: ExtendedOrbitalNode | null;
  selectedNodeId: string | null;
  zoomLevel: number;
  aiInsights: Map<string, AIInsight>;
  smartMoneyScores: Map<string, { score: number; sentiment: 'Bearish' | 'Neutral' | 'Bullish' }>;
}

const getAIRecommendationColor = (recommendation: string): THREE.Color => {
  switch (recommendation) {
    case 'strong_buy': return new THREE.Color(0x00FF88);
    case 'buy': return new THREE.Color(0x66FF99);
    case 'hold': return new THREE.Color(0xFFCC00);
    case 'sell': return new THREE.Color(0xFF6666);
    case 'strong_sell': return new THREE.Color(0xFF3366);
    default: return new THREE.Color(0x8A9196);
  }
};

const getAIGlowColor = (node: ExtendedOrbitalNode, aiInsights: Map<string, AIInsight>): THREE.Color => {
  const signal = node.priceActionSignal;
  if (signal?.explosivePotential === 'High') return new THREE.Color(0x800080); // Purple
  
  const aiInsight = aiInsights.get(node.id);
  if (aiInsight) {
    if (aiInsight.opportunityScore > 80) return new THREE.Color(0x00FF88); // Green
    if (aiInsight.riskScore > 70) return new THREE.Color(0xFF3232); // Red
  }
  
  return new THREE.Color(0x00B5D8); // Blue
};

const calculateNodeRadius = (node: ExtendedOrbitalNode, zoomLevel: number, isCentral: boolean = false): number => {
  const baseRadius = isCentral ? 25 : 15;
  let volFactor = 1;
  if (node.volume && node.volume > 0) {
    const logVolume = Math.log10(node.volume);
    volFactor = Math.min(2.5, Math.max(0.5, logVolume / 10));
  }
  const zoomFactor = Math.min(2, Math.max(0.5, zoomLevel / 100));
  const aiMultiplier = node.priceActionSignal?.explosivePotential === 'High' ? 1.2 : 1.0;
  const calculatedRadius = baseRadius * volFactor * zoomFactor * aiMultiplier;
  const minRadius = isCentral ? 20 : 12;
  const maxRadius = isCentral ? 40 : 25;
  return Math.max(minRadius, Math.min(maxRadius, calculatedRadius));
};

const createTooltipData = (node: ExtendedOrbitalNode, aiInsights: Map<string, AIInsight>) => {
    const aiInsight = aiInsights.get(node.id);
    const trendReasons = [];
    if (aiInsight && aiInsight.predictions[0]) {
        if (aiInsight.predictions[0].bullishFactors) {
            trendReasons.push(...aiInsight.predictions[0].bullishFactors);
        }
        if (aiInsight.predictions[0].bearishFactors) {
            trendReasons.push(...aiInsight.predictions[0].bearishFactors);
        }
    }
    return {
        id: node.id,
        name: node.name,
        price: node.price,
        priceChange24h: node.priceChange24h,
        volume: node.volume,
        capitalFlows: node.capitalFlows,
        aiModel: aiInsight, // This is now AIInsight
        trendReasons: trendReasons,
        aiAnalysis: aiInsight ? {
            recommendation: aiInsight.recommendation,
            confidence: aiInsight.confidence,
        } : undefined,
        explosivePotential: node.priceActionSignal?.explosivePotential,
        keyFactors: aiInsight?.predictions[0]?.keyFactors,
    };
};

// Map to store Three.js objects for each node
const nodeObjects = new Map<string, { sprite: THREE.Sprite; glow: THREE.Sprite; text: THREE.Sprite; }>();
const textureLoader = new THREE.TextureLoader();

const createTextTexture = (text: string, color: string = 'white', fontSize: number = 32): THREE.Texture => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context');

  const font = `${fontSize}px Arial`;
  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize;

  canvas.width = textWidth + 10; // Add some padding
  canvas.height = textHeight + 10;

  context.font = font;
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  return new THREE.CanvasTexture(canvas);
};

export const NodeRendererComponent = React.memo((props: NodeRendererProps) => {
  const { scene, camera, canvas, nodes, centralNode, selectedNodeId, zoomLevel, aiInsights, smartMoneyScores } = props;
  const { showTooltip, hideTooltip } = useTooltip();

  // Raycaster for interactivity
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const currentIntersected = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    if (!canvas) return;

    const onMouseMove = (event: MouseEvent) => {
      // Calculate mouse position in normalized device coordinates (-1 to +1)
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);
      const intersects = raycaster.current.intersectObjects(Array.from(nodeObjects.values()).map(obj => obj.sprite));

      if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        if (currentIntersected.current !== intersectedObject) {
          currentIntersected.current = intersectedObject;
          const nodeId = (intersectedObject.userData as { nodeId: string }).nodeId;
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            const tooltipData = createTooltipData(node, aiInsights);
            showTooltip(tooltipData, { x: event.clientX, y: event.clientY });
          }
        }
      } else {
        if (currentIntersected.current) {
          hideTooltip();
          currentIntersected.current = null;
        }
      }
    };

    const onClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, camera);
      const intersects = raycaster.current.intersectObjects(Array.from(nodeObjects.values()).map(obj => obj.sprite));

      if (intersects.length > 0) {
        const nodeId = (intersects[0].object.userData as { nodeId: string }).nodeId;
        const clickEvent = new CustomEvent('node-click', { detail: { nodeId } });
        document.dispatchEvent(clickEvent);
      }
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);

    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
    };
  }, [canvas, scene, camera, nodes, aiInsights, showTooltip, hideTooltip]);

  useEffect(() => {
    // Remove nodes that are no longer in the data
    const nodeIds = new Set(nodes.map(node => node.id));
    for (const [id, obj] of nodeObjects.entries()) {
      if (!nodeIds.has(id)) {
        scene.remove(obj.sprite);
        scene.remove(obj.glow);
        scene.remove(obj.text);
        obj.sprite.material.dispose();
        obj.glow.material.dispose();
        obj.text.material.dispose();
        obj.sprite.geometry.dispose(); // Sprites don't have geometry, but good practice for other meshes
        obj.glow.geometry.dispose();
        obj.text.geometry.dispose();
        if (obj.sprite.material.map) obj.sprite.material.map.dispose();
        if (obj.glow.material.map) obj.glow.material.map.dispose();
        if (obj.text.material.map) obj.text.material.map.dispose();
        nodeObjects.delete(id);
      }
    }

    nodes.forEach(node => {
      const isCentral = node.id === centralNode?.id;
      const radius = calculateNodeRadius(node, zoomLevel, isCentral);

      let nodeObj = nodeObjects.get(node.id);

      if (!nodeObj) {
        // Create new sprites for logo, glow, and text
        const logoUrls = getLogoUrls(node.id);
        const logoTexture = textureLoader.load(logoUrls[0] || '/path/to/default-logo.png'); // Fallback
        const logoMaterial = new THREE.SpriteMaterial({ map: logoTexture, transparent: true });
        const sprite = new THREE.Sprite(logoMaterial);
        sprite.userData = { nodeId: node.id }; // Store node ID for raycasting
        scene.add(sprite);

        const glowMaterial = new THREE.SpriteMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending });
        const glow = new THREE.Sprite(glowMaterial);
        scene.add(glow);

        const textTexture = createTextTexture(node.id);
        const textMaterial = new THREE.SpriteMaterial({ map: textTexture, transparent: true });
        const text = new THREE.Sprite(textMaterial);
        scene.add(text);

        nodeObj = { sprite, glow, text };
        nodeObjects.set(node.id, nodeObj);
      }

      // Update position and scale
      nodeObj.sprite.position.set(node.x, node.y, 0);
      nodeObj.sprite.scale.set(radius * 2, radius * 2, 1);

      nodeObj.glow.position.set(node.x, node.y, -1); // Slightly behind the main sprite
      nodeObj.glow.scale.set(radius * 3, radius * 3, 1); // Larger for glow effect
      const glowColor = getAIGlowColor(node, aiInsights);
      const onChainSentiment = smartMoneyScores.get(node.id)?.sentiment;
      if (onChainSentiment === 'Bullish') nodeObj.glow.material.color.set(0x00FF00);
      else if (onChainSentiment === 'Bearish') nodeObj.glow.material.color.set(0xFF0000);
      else nodeObj.glow.material.color.set(glowColor);
      nodeObj.glow.material.opacity = onChainSentiment ? 0.9 : (aiInsights.get(node.id)?.opportunityScore > 75 ? 0.8 : 0.5);

      nodeObj.text.position.set(node.x, node.y - radius - 16, 0); // Position below the node
      nodeObj.text.scale.set(radius, radius / 2, 1); // Adjust text scale as needed
      if (nodeObj.text.material.map) nodeObj.text.material.map.dispose(); // Dispose old texture
      nodeObj.text.material.map = createTextTexture(node.id, 'white', 32);
      nodeObj.text.material.needsUpdate = true;

      // Handle selection glow
      if (selectedNodeId === node.id) {
        nodeObj.sprite.material.color.set(0xffffff); // White tint for selected
        nodeObj.glow.material.color.set(0xffffff); // White glow for selected
        nodeObj.glow.material.opacity = 1.0;
      } else {
        nodeObj.sprite.material.color.set(0xffffff); // Reset tint
      }

      // Handle explosive potential trail (simplified for Three.js)
      // This would require more complex geometry or a particle system in Three.js
      // For now, we'll just adjust glow for explosive potential
      if (node.priceActionSignal?.explosivePotential === 'High') {
        nodeObj.glow.material.color.set(0x800080); // Purple glow
        nodeObj.glow.material.opacity = 0.9;
      }
    });

    // Cleanup on unmount
    return () => {
      for (const [id, obj] of nodeObjects.entries()) {
        scene.remove(obj.sprite);
        scene.remove(obj.glow);
        scene.remove(obj.text);
        obj.sprite.material.dispose();
        obj.glow.material.dispose();
        obj.text.material.dispose();
        if (obj.sprite.material.map) obj.sprite.material.map.dispose();
        if (obj.glow.material.map) obj.glow.material.map.dispose();
        if (obj.text.material.map) obj.text.material.map.dispose();
      }
      nodeObjects.clear();
    };
  }, [nodes, centralNode, selectedNodeId, zoomLevel, aiInsights, smartMoneyScores, scene, camera]);

  return null;
});