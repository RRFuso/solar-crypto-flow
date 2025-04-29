
import React, { useState, useEffect } from 'react';

const CapitalFlowPanel = () => {
  const [zoomLevel, setZoomLevel] = useState(0.4); // 40% padrão
  const [circles, setCircles] = useState<Circle[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    const animate = () => {
      // Atualiza posição dos círculos
      const updatedCircles = circles.map(circle => {
        const angle = circle.angle + circle.speed;
        return {
          ...circle,
          x: circle.centerX + circle.orbitRadius * Math.cos(angle),
          y: circle.centerY + circle.orbitRadius * Math.sin(angle),
          angle,
        };
      });

      // Atualiza linhas de fluxo baseadas nas novas posições dos círculos
      const updatedConnections = connections.map(connection => {
        const source = updatedCircles.find(c => c.id === connection.sourceId);
        const target = updatedCircles.find(c => c.id === connection.targetId);
        if (source && target) {
          return {
            ...connection,
            startX: source.x,
            startY: source.y,
            endX: target.x,
            endY: target.y,
          };
        }
        return connection;
      });

      setCircles(updatedCircles);
      setConnections(updatedConnections);

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.1)); // Agora pode chegar a 10%

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}>
      {/* Renderiza círculos */}
      {circles.map(circle => (
        <div key={circle.id} className="absolute rounded-full bg-blue-500" style={{ top: circle.y, left: circle.x, width: 30, height: 30 }} />
      ))}

      {/* Renderiza linhas */}
      {connections.map((conn, idx) => (
        <svg key={idx} className="absolute pointer-events-none" style={{ top: 0, left: 0, width: '100%', height: '100%' }}>
          <line x1={conn.startX} y1={conn.startY} x2={conn.endX} y2={conn.endY} stroke="green" strokeWidth="2" />
        </svg>
      ))}

      {/* Botões de Zoom */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button onClick={zoomIn} className="bg-green-500 text-white p-2 rounded">Zoom +</button>
        <button onClick={zoomOut} className="bg-red-500 text-white p-2 rounded">Zoom -</button>
      </div>
    </div>
  );
};

export default CapitalFlowPanel;
