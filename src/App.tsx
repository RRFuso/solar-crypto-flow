
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider, useTooltip } from "@/contexts/TooltipContext";
import { OnChainDataProvider } from "@/contexts/OnChainDataContext";
import { UnifiedTooltip } from "@/components/ui/UnifiedTooltip";
import ModernAIChatPanel from "@/components/ai/ModernAIChatPanel";
import Index from "./pages/Index";
import "./App.css";

const queryClient = new QueryClient();

function TooltipRenderer() {
  const { isTooltipVisible, tooltipData, tooltipPosition } = useTooltip();
  return isTooltipVisible ? <UnifiedTooltip data={tooltipData} position={tooltipPosition} /> : null;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OnChainDataProvider>
          <TooltipProvider>
            <RouterProvider router={router} />
            <Toaster />
            <TooltipRenderer />
            <div className="fixed bottom-4 right-4 z-50">
              <ModernAIChatPanel />
            </div>
          </TooltipProvider>
        </OnChainDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
