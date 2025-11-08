import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// Cache estratégico por tipo de dado
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Defaults conservadores
      staleTime: 2 * 60 * 1000, // 2 min - dados ficam fresh
      gcTime: 10 * 60 * 1000, // 10 min - cache persiste
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
      // Configurações específicas por query usando queryKey patterns
    },
  },
});

// Cache longo para dados estáticos
queryClient.setQueryDefaults(['cached_crypto_logos'], {
  staleTime: 24 * 60 * 60 * 1000, // 24h - logos não mudam
  gcTime: 7 * 24 * 60 * 60 * 1000, // 7 dias
  refetchOnMount: false,
});

// Cache médio para dados de mercado (Capital Flow)
queryClient.setQueryDefaults(['capital-flow-fallback'], {
  staleTime: 3 * 60 * 1000, // 3 min - balance entre atualização e performance
  gcTime: 30 * 60 * 1000, // 30 min - mantém em cache por muito tempo
  refetchOnMount: false, // Não refetch ao montar se ainda fresh
});

// Cache curto para preços em tempo real
queryClient.setQueryDefaults(['crypto-prices-realtime'], {
  staleTime: 30 * 1000, // 30s - preços mudam rápido
  gcTime: 5 * 60 * 1000, // 5 min
});

// Cache médio para dados históricos
queryClient.setQueryDefaults(['crypto_historical_data'], {
  staleTime: 5 * 60 * 1000, // 5 min
  gcTime: 15 * 60 * 1000, // 15 min
});

// Cache médio para sinais e análises
queryClient.setQueryDefaults(['price-action-signals', 'advanced-ai', 'flow-analysis'], {
  staleTime: 2 * 60 * 1000, // 2 min
  gcTime: 10 * 60 * 1000, // 10 min
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
