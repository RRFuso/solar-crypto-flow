# Roadmap (auditoria Solar Crypto Flow)

Restrição: só planos gratuitos de API, sem custos novos.

- [x] Fase 1: autorização por ação (alerts, tracker, cron, populate, logos) + segredo de cron
- [x] Publicar funções protegidas
- [x] Fase 4: sinais mensuráveis (horizonte/baseline definidos)
- [x] Fase 5: CME gaps honestos (sem fonte CME gratuita -> marcar indisponível)
- [x] Fase 6: backtest sem look-ahead
- [x] Fase 7: deduplicação de chamadas/cache
- [x] Fase 8: prompt do Oracle (fato/interpretação/incerteza)

## Pipeline de IA (prompt 14/10/2026)
- [x] Fase 0: mapa + remover histórico inventado (dataAggregator) e simulações (featureExtractor)
- [x] Fase 1–2: tabelas de candles/OI/funding + coleta em lote no servidor
- [x] Fase 3: indicadores com testes, multi-timeframe (RSI/MACD/ADX corrigidos; 13 testes com candles reais de BTC 1h/4h)
- [x] Fase 4: sinal estruturado (fatores, viés, invalidação, horizonte) a partir de market_candles; Oracle só interpreta; regras "LSTM/GRU" renomeadas como heurísticas; bug do RSI sem quedas corrigido
- [x] Fase 5: validação com histórico real — backtest walk-forward (signalBacktest.ts + scripts/backtest-signals.ts) sobre market_candles (10 moedas, 1h/4h, ~4 semanas). Resultado 05/11/2026: acerto 39–53% (1h) e 39–53% (4h), excesso vs BTC ≈ 0 — o sinal atual NÃO tem vantagem preditiva; regras precisam de calibração medida
- [x] Fase 6: calibração (05/11/2026) — grade de 18 configs (scoreCut 30/45/60 × adxGate 0/20/25 × RSI ligado/desligado) com divisão treino/validação em 10 moedas, 1h+4h. Resultado: NENHUMA config vence o acaso — melhor treino 47.5%, validação 44.3%. Conclusão: RSI/MACD/EMA/ADX nesses prazos descrevem o estado da tendência, não preveem retorno. Sinal permanece como "Sinal de Tendência" educacional com disclaimer "não validado" — NÃO transformar em recomendação. Re-testar quando houver mais meses de histórico acumulado
