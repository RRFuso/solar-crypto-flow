
import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider, useTooltip } from "@/contexts/TooltipContext";
import { OnChainDataProvider } from "@/contexts/OnChainDataContext";
import { BinanceWebSocketProvider } from "@/contexts/BinanceWebSocketContext";
import { UnifiedTooltip } from "@/components/ui/UnifiedTooltip";
import "./App.css";

const Index = lazy(() => import("./pages/Index"));
const Landing = lazy(() => import("./pages/Landing"));
const AdminPerf = lazy(() => import("./pages/AdminPerf"));

function RouteFallback() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-muted-foreground">
      Carregando...
    </div>
  );
}

function TooltipRenderer() {
  const { isTooltipVisible, tooltipData, tooltipPosition } = useTooltip();
  return isTooltipVisible ? <UnifiedTooltip data={tooltipData} position={tooltipPosition} /> : null;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<RouteFallback />}>
        <Landing />
      </Suspense>
    ),
  },
  {
    path: "/app",
    element: (
      <Suspense fallback={<RouteFallback />}>
        <Index />
      </Suspense>
    ),
  },
  {
    path: "/admin",
    element: (
      <Suspense fallback={<RouteFallback />}>
        <AdminPerf />
      </Suspense>
    ),
  },
]);

function App() {
  return (
    <AuthProvider>
      <BinanceWebSocketProvider>
        <OnChainDataProvider>
          <TooltipProvider>
            <RouterProvider router={router} />
            <Toaster />
            <TooltipRenderer />
          </TooltipProvider>
        </OnChainDataProvider>
      </BinanceWebSocketProvider>
    </AuthProvider>
  );
}

export default App;
