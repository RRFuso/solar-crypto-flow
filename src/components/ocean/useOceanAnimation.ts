import { useState, useEffect, useRef } from 'react';

interface FishPosition {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  targetX: number;
  targetY: number;
}

export const useOceanAnimation = (
  containerRef: React.RefObject<HTMLDivElement>,
  itemCount: number
) => {
  const [positions, setPositions] = useState<FishPosition[]>([]);
  const animationFrameRef = useRef<number>();

  // Initialize fish positions
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();
    
    const initialPositions: FishPosition[] = Array.from({ length: itemCount }).map((_, index) => {
      const zone = Math.floor(index * 3 / itemCount); // 0, 1, or 2 for top, middle, bottom
      const zoneHeight = height / 3;
      const baseY = zone * zoneHeight + zoneHeight / 2;
      
      return {
        x: Math.random() * (width - 100) + 50,
        y: baseY + (Math.random() - 0.5) * (zoneHeight * 0.5),
        velocityX: (Math.random() - 0.5) * 1, // Reduced initial velocity
        velocityY: (Math.random() - 0.5) * 1,
        targetX: Math.random() * (width - 100) + 50,
        targetY: baseY + (Math.random() - 0.5) * (zoneHeight * 0.5),
      };
    });

    setPositions(initialPositions);
  }, [itemCount]);

  // Animation loop with easing
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();
    const minDistance = 80; // Increased minimum distance between fish
    const maxSpeed = 1; // Reduced maximum speed
    const turnFactor = 0.02; // Reduced turn factor for smoother transitions
    const easeStrength = 0.3; // Easing strength for smooth acceleration/deceleration

    const animate = () => {
      setPositions(prevPositions => {
        return prevPositions.map((fish, index) => {
          // Calculate new target with easing
          const distanceToTarget = Math.hypot(fish.targetX - fish.x, fish.targetY - fish.y);
          if (distanceToTarget < 30) { // Reduced distance threshold
            const zone = Math.floor(index * 3 / itemCount);
            const zoneHeight = height / 3;
            const baseY = zone * zoneHeight + zoneHeight / 2;
            
            fish.targetX = Math.random() * (width - 100) + 50;
            fish.targetY = baseY + (Math.random() - 0.5) * (zoneHeight * 0.5);
          }

          // Calculate desired velocity with easing
          const dx = fish.targetX - fish.x;
          const dy = fish.targetY - fish.y;
          const angle = Math.atan2(dy, dx);
          
          // Apply easing to velocity changes
          const targetVelocityX = Math.cos(angle) * maxSpeed;
          const targetVelocityY = Math.sin(angle) * maxSpeed;
          
          let newVelocityX = fish.velocityX + (targetVelocityX - fish.velocityX) * turnFactor;
          let newVelocityY = fish.velocityY + (targetVelocityY - fish.velocityY) * turnFactor;

          // Apply collision avoidance with easing
          prevPositions.forEach((otherFish, otherIndex) => {
            if (index !== otherIndex) {
              const dx = fish.x - otherFish.x;
              const dy = fish.y - otherFish.y;
              const distance = Math.hypot(dx, dy);
              
              if (distance < minDistance) {
                const angle = Math.atan2(dy, dx);
                const repelStrength = (minDistance - distance) / minDistance * easeStrength;
                newVelocityX += Math.cos(angle) * repelStrength;
                newVelocityY += Math.sin(angle) * repelStrength;
              }
            }
          });

          // Normalize velocity with easing
          const speed = Math.hypot(newVelocityX, newVelocityY);
          if (speed > maxSpeed) {
            newVelocityX = (newVelocityX / speed) * maxSpeed;
            newVelocityY = (newVelocityY / speed) * maxSpeed;
          }

          // Update position with easing
          let newX = fish.x + newVelocityX;
          let newY = fish.y + newVelocityY;

          // Bounce off walls with easing
          if (newX < 50) { newX = 50; newVelocityX *= -0.5; }
          if (newX > width - 50) { newX = width - 50; newVelocityX *= -0.5; }
          if (newY < 50) { newY = 50; newVelocityY *= -0.5; }
          if (newY > height - 50) { newY = height - 50; newVelocityY *= -0.5; }

          return {
            ...fish,
            x: newX,
            y: newY,
            velocityX: newVelocityX,
            velocityY: newVelocityY,
          };
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [itemCount]);

  return positions;
};