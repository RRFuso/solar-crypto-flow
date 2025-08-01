-- Inserir dados on-chain correspondentes para complementar os sinais preditivos (valores válidos)
INSERT INTO crypto_price_action_signals (
    symbol,
    explosive_potential,
    is_accumulation,
    is_distribution,
    is_breakout,
    is_expansion,
    is_accelerating,
    whale_activity,
    accumulation_strength,
    distribution_strength,
    smart_money_sentiment,
    factors
) VALUES 
('BTCUSDT', 'High', false, false, true, true, false, 75, 40, 10, 'bullish', ARRAY['Institutional buying', 'ETF inflows']),
('ETHUSDT', 'Medium', true, false, false, false, false, 60, 85, 15, 'bullish', ARRAY['DeFi activity', 'Staking growth']),
('SOLUSDT', 'Medium', false, true, false, false, false, 45, 20, 80, 'bearish', ARRAY['Validator issues', 'Network instability']),
('XRPUSDT', 'Low', false, false, false, false, false, 55, 65, 30, 'neutral', ARRAY['Legal clarity', 'Banking partnerships']),
('ADAUSDT', 'Low', false, false, false, false, false, 40, 70, 25, 'neutral', ARRAY['Development progress', 'Ecosystem growth']),
('AVAXUSDT', 'High', false, false, true, false, true, 70, 35, 20, 'bullish', ARRAY['Subnet activity', 'Gaming narrative']),
('DOTUSDT', 'Medium', true, false, false, false, false, 50, 75, 25, 'neutral', ARRAY['Parachain auctions', 'Polkadot 2.0']),
('LINKUSDT', 'High', false, false, true, true, true, 80, 30, 5, 'bullish', ARRAY['Oracle demand', 'Real-world assets'])

ON CONFLICT (symbol) 
DO UPDATE SET 
    explosive_potential = EXCLUDED.explosive_potential,
    is_accumulation = EXCLUDED.is_accumulation,
    is_distribution = EXCLUDED.is_distribution,
    is_breakout = EXCLUDED.is_breakout,
    is_expansion = EXCLUDED.is_expansion,
    is_accelerating = EXCLUDED.is_accelerating,
    whale_activity = EXCLUDED.whale_activity,
    accumulation_strength = EXCLUDED.accumulation_strength,
    distribution_strength = EXCLUDED.distribution_strength,
    smart_money_sentiment = EXCLUDED.smart_money_sentiment,
    factors = EXCLUDED.factors,
    last_updated = now();