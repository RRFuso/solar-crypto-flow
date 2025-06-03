export default function Home() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground overflow-hidden">
      <div className="flex flex-col h-full w-full">
        {/* Topbar, filtros, etc. */}
        <header className="w-full px-4 md:px-6 py-4">
          <h1 className="text-xl font-bold">🔥 Capital Flow</h1>
        </header>

        {/* Área dinâmica do gráfico */}
        <section className="flex-1 overflow-hidden">
          <CapitalFlowCanvas />
        </section>
      </div>
    </main>
  );
}

// src/components/CapitalFlowCanvas.tsx
// Componente que renderiza a visualização dinâmica e responsiva

import { useEffect, useRef } from "react";

export function CapitalFlowCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resizeCanvas = () => {
      if (!canvasRef.current) return;

      const container = canvasRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Aqui você chamaria o método do grafo/visualização para se redimensionar:
      // forceGraphInstance.current.width(width).height(height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  return (
    <div
      ref={canvasRef}
      className="w-full h-full relative"
    >
      {/* Visualização solar com gráfico de fluxo de capital */}
      {/* Ex: <ForceGraph3D ref={forceGraphInstance} ... /> */}
    </div>
  );
}
