
import * as d3 from 'd3';
import { LinkData } from '@/types/capitalFlow';
import { globalAnimator, domBatcher } from '@/utils/animationOptimizer';
import { FlowParticleConfig, SMART_MONEY_COLORS } from '@/types/smartMoney';
import { lodManager } from '@/lib/visualization/LODManager';

interface ParticleData {
  linkIndex: number;
  path: SVGPathElement;
  progress: number;
  speed: number;
  direction: number;
  color: string;
  pathLength: number;
  element: d3.Selection<SVGCircleElement, unknown, null, undefined>;
}

// Função para obter configuração de partícula baseada em dados de smart money
type FlowConfigGetter = (link: LinkData) => FlowParticleConfig;

/**
 * Sistema otimizado de partículas com animação fluida
 * Suporta dados reais de fluxo on-chain para direção e cor
 * Integrado com sistema LOD para performance adaptativa
 */
export const addFlowParticles = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  linkGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  links: LinkData[],
  selectedNodeId?: string | null,
  getFlowConfig?: FlowConfigGetter
) => {
  // Get current LOD settings
  const lodSettings = lodManager.getAdjustedSettings();
  // Remove any existing particles first
  svg.selectAll(".particles-group").remove();
  
  // Create particle group
  const particleGroup = linkGroup.append("g")
    .attr("class", "particles-group");
  
  const particles: ParticleData[] = [];
  
  // Process each link for particle animation
  links.forEach((link: LinkData, linkIndex) => {
    // Determine if this link is connected to the selected node
    const isConnectedToSelected = selectedNodeId
      ? (link.source.id === selectedNodeId || link.target.id === selectedNodeId)
      : true;
    
    // Get the path element for this link
    const path = svg.select(`#link-${linkIndex}`).node() as SVGPathElement;
    if (!path) return;
    
    // Obter configuração de fluxo real (se disponível)
    const flowConfig = getFlowConfig ? getFlowConfig(link) : null;
    
    // Determinar direção: usar dados reais se disponíveis, senão usar percentage
    const direction = flowConfig?.direction ?? (link.percentage > 0 ? 1 : -1);
    
    // Determinar cor baseada no fluxo real
    let particleColor: string = SMART_MONEY_COLORS.neutral; // Default amarelo
    if (flowConfig?.isRealData) {
      particleColor = flowConfig.color;
    } else if (link.percentage > 0) {
      particleColor = SMART_MONEY_COLORS.bullish;
    } else if (link.percentage < 0) {
      particleColor = SMART_MONEY_COLORS.bearish;
    }
    
    // Velocidade baseada na intensidade do fluxo real
    const baseSpeed = flowConfig?.speed ?? 0.002;
    
    // Calculate number of particles based on value, intensity, and LOD
    const maxBaseParticles = Math.max(1, Math.floor(lodSettings.particleCount / 5));
    let baseParticleCount = Math.max(1, Math.min(maxBaseParticles, 1 + Math.floor(Math.abs(link.value) / 20000000)));
    
    // Aumentar partículas para fluxos de alta intensidade (respeitando LOD)
    if (flowConfig?.intensity && flowConfig.intensity > 50) {
      baseParticleCount = Math.max(1, Math.floor(Math.min(lodSettings.particleCount / 3, baseParticleCount + 1)));
    }
    
    // Increase particles for selected links
    let particleCount = baseParticleCount;
    if (selectedNodeId && (link.source.id === selectedNodeId || link.target.id === selectedNodeId)) {
      particleCount = Math.max(1, Math.floor(Math.min(lodSettings.particleCount / 2, particleCount + 2)));
    }
    particleCount = Math.max(1, Math.floor(particleCount));
    
    // Create particles for this link
    for (let i = 0; i < particleCount; i++) {
      // Initial position along the path with better distribution
      const initialPosition = (i + Math.random() * 0.3) / particleCount;
      const pathLength = path.getTotalLength();
      const point = path.getPointAtLength(initialPosition * pathLength);
      
      // Tamanho variável baseado na intensidade e LOD
      const particleSize = flowConfig?.intensity 
        ? lodSettings.particleSize * 0.7 + (flowConfig.intensity / 100) * lodSettings.particleSize * 0.5
        : lodSettings.particleSize * 0.8;
      
      // Glow effect baseado no LOD
      const glowSize = lodSettings.enableGlow 
        ? (flowConfig?.isRealData ? 5 * lodSettings.glowIntensity : 3 * lodSettings.glowIntensity)
        : 0;
      
      // Create particle element with conditional glow effect
      // Dim particles on unconnected links instead of hiding them
      const baseOpacity = flowConfig?.isRealData ? 0.9 : 0.7;
      const opacity = isConnectedToSelected ? baseOpacity : 0.12;
      const size = isConnectedToSelected ? particleSize : particleSize * 0.6;

      const element = particleGroup.append("circle")
        .attr("class", `particle ${flowConfig?.isRealData ? 'real-flow' : ''}`)
        .attr("r", size)
        .attr("fill", particleColor)
        .attr("cx", point.x)
        .attr("cy", point.y)
        .attr("opacity", opacity);
      
      // Apply glow only if LOD allows
      if (glowSize > 0) {
        element.style("filter", `drop-shadow(0 0 ${glowSize}px ${particleColor})`);
      }
      
      // Store particle data
      particles.push({
        linkIndex,
        path: path,
        progress: initialPosition,
        speed: baseSpeed + Math.random() * 0.001,
        direction: direction,
        color: particleColor,
        pathLength: pathLength,
        element: element
      });
    }
  });
  
  // Optimized animation loop using global animator with LOD-based update rate
  let lastUpdate = 0;
  const animateParticles = (deltaTime: number) => {
    // Record frame for LOD manager
    lodManager.recordFrame();
    
    // Throttle updates based on LOD settings
    const now = performance.now();
    if (now - lastUpdate < lodManager.getLevel().updateInterval) {
      return;
    }
    lastUpdate = now;
    
    // Batch DOM operations for better performance
    const updates: (() => void)[] = [];
    
    particles.forEach(particle => {
      const direction = particle.direction === 0 ? 1 : particle.direction;
      particle.progress = (particle.progress + (particle.speed * direction * deltaTime / 16.67)) % 1;
      if (particle.progress < 0) particle.progress += 1;
      
      // Calculate position along path
      if (particle.path) {
        const currentPathLength = particle.path.getTotalLength();
        if (currentPathLength <= 0) return;
        particle.pathLength = currentPathLength;
        const point = particle.path.getPointAtLength(particle.progress * particle.pathLength);
        
        // Batch the DOM update
        updates.push(() => {
          particle.element
            .attr("cx", point.x)
            .attr("cy", point.y);
        });
      }
    });
    
    // Execute all DOM updates at once
    if (updates.length > 0) {
      domBatcher.add(() => updates.forEach(update => update()));
    }
  };
  
  // Register with global animator
  globalAnimator.addCallback(animateParticles);
  globalAnimator.start();
  
  // Return cleanup function
  return () => {
    globalAnimator.removeCallback(animateParticles);
    particles.length = 0;
  };
};