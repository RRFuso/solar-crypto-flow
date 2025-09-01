-- Populate token_contracts table with major cryptocurrency contract addresses
INSERT INTO public.token_contracts (symbol, contract_address, chain) VALUES
-- Ethereum Mainnet (chain id: 1)
('USDT', '0xdac17f958d2ee523a2206206994597c13d831ec7', 'ethereum'),
('USDC', '0xa0b86991c431e803b0c002dca1205dfacdc7ce4bb', 'ethereum'), 
('SHIB', '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', 'ethereum'),
('LINK', '0x514910771af9ca656af840dff83e8264ecf986ca', 'ethereum'),
('UNI', '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', 'ethereum'),
('WBTC', '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', 'ethereum'),
('WETH', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', 'ethereum'),
('MATIC', '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', 'ethereum'),
('CRO', '0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b', 'ethereum'),
('SAND', '0x3845badade8e6dff049820680d1f14bd3903a5d0', 'ethereum'),
('APE', '0x4d224452801aced8b2f0aebe155379bb5d594381', 'ethereum'),

-- BSC (Binance Smart Chain)
('BUSD', '0xe9e7cea3dedca5984780bafc599bd69add087d56', 'bsc'),
('CAKE', '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82', 'bsc'),

-- Polygon 
('WMATIC', '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', 'polygon')

ON CONFLICT (symbol, contract_address) DO NOTHING;