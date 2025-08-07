
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
import AuthPage from "@/components/auth/AuthPage";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import "./App.css";

const queryClient = new QueryClient();

function TooltipRenderer() {
  const { isTooltipVisible, tooltipData, tooltipPosition } = useTooltip();
  return isTooltipVisible ? <UnifiedTooltip data={tooltipData} position={tooltipPosition} /> : null;
}

const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Index />
      </ProtectedRoute>
    ),
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
          </TooltipProvider>
        </OnChainDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
