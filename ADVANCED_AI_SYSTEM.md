# Sistema de IA Avançada - Solar Crypto Flow

## Visão Geral

O Solar Crypto Flow agora incorpora um sistema de IA avançada que vai além dos indicadores técnicos tradicionais, oferecendo:

- **Análise de Sentimento em Tempo Real**: Avalia o sentimento do mercado através de notícias e mídias sociais
- **Predições ML**: Modelos de machine learning para prever movimentos de preço, volatilidade e rompimentos
- **Personalização Baseada em Perfil**: Adapta recomendações ao perfil de risco e objetivos do usuário
- **Rastreamento de Comportamento**: Aprende com as interações do usuário para melhorar recomendações

## Arquitetura

### 1. Banco de Dados

#### Tabelas Criadas:

**`user_profiles`**: Perfil de investimento do usuário
- `risk_profile`: conservative | moderate | aggressive
- `investment_horizon`: short | medium | long
- `max_position_size`: % máximo do portfólio por posição
- `stop_loss_percentage`: % de perda máxima aceitável
- `take_profit_percentage`: % de ganho objetivo
- `preferred_assets`: Lista de ativos favoritos
- `preferred_categories`: Categorias de interesse

**`sentiment_data`**: Análise de sentimento em cache
- `symbol`: Símbolo da criptomoeda
- `sentiment_score`: Score de -1 (bearish) a 1 (bullish)
- `sentiment_label`: positive | neutral | negative
- `confidence`: Nível de confiança da análise
- `key_topics`: Tópicos influenciadores
- `volume`: Volume de menções

**`ai_predictions`**: Predições de ML
- `prediction_type`: price | volatility | breakout | reversal
- `predicted_value`: Valor previsto
- `confidence`: Confiança da predição (0-1)
- `risk_score`: Score de risco (0-1)
- `supporting_factors`: Fatores que suportam a predição
- `features`: Características técnicas usadas
- `valid_until`: Validade da predição

**`user_interactions`**: Rastreamento de comportamento
- `interaction_type`: view | click | favorite | trade | alert
- `symbol`: Símbolo relacionado
- `metadata`: Dados adicionais

### 2. Edge Functions

#### `sentiment-analysis`
Analisa sentimento de mercado usando Lovable AI (Google Gemini 2.5 Flash)

**Input:**
```json
{
  "symbols": ["BTC", "ETH", "SOL"]
}
```

**Funcionalidades:**
- Cache de 5 minutos para reduzir custos
- Análise de múltiplas fontes (notícias, social)
- Extração de tópicos-chave
- Score normalizado de -1 a 1

#### `ml-predictions`
Gera predições ML usando dados históricos, sinais técnicos e sentimento

**Input:**
```json
{
  "symbol": "BTC",
  "timeframe": "4h",
  "predictionHorizon": "24h"
}
```

**Funcionalidades:**
- Análise de séries temporais (últimos 100 pontos)
- Correlação com sinais técnicos
- Incorporação de sentimento
- Cache de 10 minutos
- Múltiplos tipos de predição

### 3. Hooks React

#### `useUserProfile()`
Gerencia perfil de investimento do usuário
```typescript
const { profile, updateProfile, isLoading } = useUserProfile();
```

#### `useSentimentData(symbols: string[])`
Busca dados de sentimento para múltiplos símbolos
```typescript
const { sentimentMap, isLoading } = useSentimentMap(['BTC', 'ETH']);
```

#### `useMLPredictions(symbol, timeframe, horizon)`
Gera/busca predições ML para um símbolo
```typescript
const { data: prediction, isLoading } = useMLPredictions('BTC', '4h', '24h');
```

#### `useUserInteractions()`
Rastreia interações do usuário
```typescript
const { trackInteraction } = useUserInteractions();
trackInteraction({ type: 'click', symbol: 'BTC' });
```

## Otimizações de Performance

### 1. Cacheamento Inteligente
- **Sentimento**: Cache de 5 minutos (dados menos voláteis)
- **Predições ML**: Cache de 10 minutos (computacionalmente caras)
- **Perfil de Usuário**: Cache de 10 minutos (raramente muda)

### 2. Estratégias de Refetch
- **Auto-refetch**: 1 minuto para dados de fluxo de capital
- **Refetch interval**: 5 minutos para dados de IA
- **staleTime otimizado**: Balanceando pontualidade vs egress

### 3. Redução de Egress
- Batch requests para múltiplos símbolos
- Cache em nível de servidor (Edge Functions)
- Queries otimizadas com índices
- Limitação de símbolos analisados (top 15)

### 4. React Performance
- `React.memo` em componentes pesados
- `useCallback` para funções passadas como props
- `useMemo` para computações caras
- Contextos isolados (FlowControlsContext)

## Personalização com IA

### Perfil de Risco

**Conservative:**
- Foco em stablecoins e large caps
- Stop loss mais apertado (3-5%)
- Alertas apenas para oportunidades de baixo risco

**Moderate:**
- Mix de large caps e mid caps
- Stop loss balanceado (5-8%)
- Alertas importantes e críticos

**Aggressive:**
- Foco em small caps e altcoins
- Stop loss mais amplo (10-15%)
- Todos os alertas incluindo especulativos

### Horizonte de Investimento

- **Short**: Day trading, swing trading (1h-24h predictions)
- **Medium**: Position trading (24h-7d predictions)
- **Long**: Buy and hold (7d-30d predictions)

## Explicações de IA (XAI)

As predições incluem:

1. **Supporting Factors**: Lista de razões técnicas e fundamentais
2. **Confidence Score**: Nível de certeza da IA
3. **Risk Score**: Avaliação de risco da oportunidade
4. **Key Features**: Métricas técnicas usadas na análise

Exemplo:
```json
{
  "prediction_type": "breakout",
  "confidence": 0.85,
  "supporting_factors": [
    "Volume aumentando 45% acima da média",
    "RSI saindo de oversold",
    "Sentimento social extremamente positivo",
    "Suporte forte em $95,000"
  ],
  "features": {
    "trend_strength": 0.78,
    "momentum": 0.82,
    "volatility_index": 0.45,
    "sentiment_alignment": 0.91
  }
}
```

## Próximos Passos

### Fase 2 - Modelos Proprietários
- Treinar modelos LSTM em dados históricos
- Implementar ensemble de modelos
- Análise de correlação macro-econômica

### Fase 3 - Análise On-Chain Avançada
- Whale tracking em tempo real
- Métricas de rede (TVL, endereços ativos)
- Fluxo entre exchanges

### Fase 4 - Alertas Inteligentes
- Push notifications personalizadas
- Sistema de alerta baseado em perfil
- Sumarização automática de notícias

## Monitoramento

### Métricas Chave:
- Taxa de acerto das predições
- Latência média das análises
- Taxa de cache hit/miss
- Custos de egress do Supabase
- Custos de Lovable AI

### Logs Importantes:
- Edge function logs para debugging
- Query performance do Supabase
- Erros de rate limiting (429, 402)

## Recursos

- **Lovable AI Docs**: https://docs.lovable.dev/features/ai
- **Supabase Edge Functions**: https://supabase.com/dashboard/project/bahshstcztvqmxiubslx/functions
- **Function Logs**: Monitorar logs para análise de sentimento e predições ML
