-- Inserir alguns sinais preditivos de teste para demonstração
INSERT INTO predictive_signals (
    symbol,
    signal_type,
    confidence,
    strength,
    factors,
    risk_level,
    target_gain,
    timeframe,
    phase,
    volume_anomaly,
    smart_money_flow,
    support_level,
    volume_profile,
    rsi_divergence
) VALUES
-- Sinal explosivo para BTC
('BTC', 'explosive_upside', 0.85, 0.8, ARRAY['Volume 3.2x acima da média', 'Breakout técnico detectado', 'RSI em zona saudável (55)', 'Smart money bullish'], 'low', 25.5, '4h', 'middle', true, 'in', NULL, NULL, false),

-- Sinal de acumulação para ETH
('ETH', 'accumulation_edge', 0.75, 0.7, ARRAY['Volume baixo consolidação', 'RSI oversold recovery', 'Whale accumulation'], 'medium', 0, '1d', 'early', false, 'out', NULL, 'decreasing', false),

-- Sinal de distribuição para SOL
('SOL', 'distribution_edge', 0.78, 0.75, ARRAY['Volume alto após alta', 'RSI overbought', 'Exchange inflows'], 'medium', 0, '4h', 'middle', true, 'in', NULL, 'normal', false),

-- Sinal de reversão para XRP
('XRP', 'reversal_bottom', 0.82, 0.0, ARRAY['RSI divergência bullish', 'Support bounce', 'Volume decreasing'], 'low', 0, '1d', NULL, false, 'neutral', 0.5245, 'decreasing', true),

-- Sinal de capitulação para ADA
('ADA', 'capitulation_bottom', 0.88, 0.0, ARRAY['Panic selling exhausted', 'Volume spike extremo', 'RSI oversold recovery'], 'very_low', 0, '4h', NULL, false, 'neutral', 0.3156, 'spike', false),

-- Sinal explosivo para AVAX
('AVAX', 'explosive_upside', 0.79, 0.75, ARRAY['Breakout de resistência', 'Volume crescente', 'Momentum building'], 'medium', 18.2, '4h', 'late', true, 'in', NULL, NULL, false),

-- Sinal de acumulação para DOT
('DOT', 'accumulation_edge', 0.71, 0.68, ARRAY['Consolidação lateral', 'Smart money activity', 'Low volatility'], 'low', 0, '1d', 'middle', false, 'out', NULL, 'normal', false),

-- Sinal explosivo para LINK
('LINK', 'explosive_upside', 0.91, 0.85, ARRAY['Volume explosivo', 'Rompimento de ATR', 'Fundamentals bullish', 'DeFi narrative'], 'low', 35.8, '1h', 'early', true, 'in', NULL, NULL, false)

ON CONFLICT (symbol, signal_type)
DO UPDATE SET
    confidence = EXCLUDED.confidence,
    strength = EXCLUDED.strength,
    factors = EXCLUDED.factors,
    risk_level = EXCLUDED.risk_level,
    target_gain = EXCLUDED.target_gain,
    timeframe = EXCLUDED.timeframe,
    phase = EXCLUDED.phase,
    volume_anomaly = EXCLUDED.volume_anomaly,
    smart_money_flow = EXCLUDED.smart_money_flow,
    support_level = EXCLUDED.support_level,
    volume_profile = EXCLUDED.volume_profile,
    rsi_divergence = EXCLUDED.rsi_divergence,
    updated_at = now();
