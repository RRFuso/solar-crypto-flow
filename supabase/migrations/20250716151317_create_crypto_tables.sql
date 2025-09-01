-- Insert popular token contracts for testing on-chain data
INSERT INTO token_contracts (symbol, contract_address, chain) VALUES
('BTC', '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', 'ethereum'), -- WBTC
('ETH', '0x0000000000000000000000000000000000000000', 'ethereum'), -- Native ETH
('USDT', '0xdac17f958d2ee523a2206206994597c13d831ec7', 'ethereum'),
('USDC', '0xa0b86a33e6180d7d49b3d7c3ff8b5cd3c77ce4e0', 'ethereum'),
('SHIB', '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', 'ethereum'),
('LINK', '0x514910771af9ca656af840dff83e8264ecf986ca', 'ethereum'),
('UNI', '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', 'ethereum'),
('PEPE', '0x6982508145454ce325ddbe47a25d4ec3d2311933', 'ethereum'),
('DOGE', '0x4206931337dc273a630d328da6441786bfad668f', 'ethereum'),
('ADA', '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47', 'ethereum')
ON CONFLICT (symbol, contract_address) DO NOTHING;