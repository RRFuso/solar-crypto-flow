# Otimizações de Egress Implementadas

## Problema Identificado
- **Egress atual**: 7.489 GB / 5 GB (150% do limite)
- **Cached Egress**: 0 GB (não utilizado)

## Otimizações Aplicadas

### 1. Configuração Global do React Query (main.tsx)
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000,      // 15 minutos (antes: padrão 0ms)
      gcTime: 30 * 60 * 1000,          // 30 minutos de cache
      refetchOnWindowFocus: false,     // Desabilitado
      refetchOnReconnect: false,       // Desabilitado
      retry: 1,                        // Reduzido de 3 para 1
    },
  },
})
```

**Impacto esperado**: Redução de ~60-70% nas requisições desnecessárias

### 2. Otimização do useRealtimePrice
- Removidos logs de console desnecessários
- Adicionado `limit(1)` explícito nas queries
- Configurado `broadcast: { self: false }` no channel
- Seleção apenas do campo `price` necessário

**Impacto esperado**: Redução de ~20-30% no payload

### 3. Otimização do useRealTimeSignals
- Intervalo de auto-refresh aumentado de 5 para 15 minutos
- Removidos logs de console
- Configurado `broadcast: { self: false }`

**Impacto esperado**: Redução de ~66% nas requisições de polling

### 4. Otimização do useCryptoData
- StaleTime já estava em 10 minutos (600000ms)
- Cache de longo prazo já implementado

## Próximas Recomendações

### Curto Prazo (Implementar se Egress continuar alto)
1. **Paginação**: Limitar queries grandes com `.limit()` e implementar scroll infinito
2. **Select específico**: Substituir `select('*')` por campos específicos em todas as queries
3. **Comprimir Edge Functions**: Habilitar compressão gzip nas respostas

### Médio Prazo
1. **Supabase Storage + CDN**: Mover assets estáticos para Storage com CDN
2. **Aggregate queries**: Usar views materializadas para dados agregados
3. **WebSocket batching**: Agrupar múltiplas atualizações em uma única mensagem

### Longo Prazo
1. **Service Worker**: Implementar cache offline com Service Worker
2. **GraphQL**: Considerar GraphQL para queries mais precisas
3. **Redis cache**: Cache externo para dados frequentes

## Monitoramento
Verifique o painel Supabase em 24-48h para medir impacto:
- **Meta**: Reduzir Egress para < 4 GB/mês (80% do limite)
- **Métrica principal**: Egress total
- **Métrica secundária**: Realtime messages
