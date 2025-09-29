import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// Configuração agressiva de cache para reduzir Egress
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // 15 minutos - dados ficam "fresh" por mais tempo
      gcTime: 30 * 60 * 1000, // 30 minutos - cache persiste por mais tempo (antes chamado cacheTime)
      refetchOnWindowFocus: false, // Não refetch ao focar janela
      refetchOnReconnect: false, // Não refetch ao reconectar
      retry: 1, // Menos retries = menos Egress
    },
  },
})

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
