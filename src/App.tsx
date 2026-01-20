
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
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import "./App.css";

function TooltipRenderer() {
  const { isTooltipVisible, tooltipData, tooltipPosition } = useTooltip();
  return isTooltipVisible ? <UnifiedTooltip data={tooltipData} position={tooltipPosition} /> : null;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/app",
    element: <Index />,
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
