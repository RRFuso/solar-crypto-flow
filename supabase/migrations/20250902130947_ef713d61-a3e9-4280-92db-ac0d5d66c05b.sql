-- Primeiro vamos adicionar a constraint única
ALTER TABLE token_contracts ADD CONSTRAINT token_contracts_symbol_chain_unique UNIQUE (symbol, chain);

-- Agora popular a tabela com mais endereços
INSERT INTO token_contracts (symbol, contract_address, chain) VALUES 
-- Ethereum mainnet tokens
('ETH', '0x0000000000000000000000000000000000000000', 'ethereum'),
('BNB', '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', 'ethereum'),
('USDC', '0xa0b86a33e6776b7c8ed2b45b4e8f6d5e8e07c3dd', 'ethereum'),
('UNI', '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', 'ethereum'),
('LINK', '0x514910771af9ca656af840dff83e8264ecf986ca', 'ethereum'),
('WETH', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', 'ethereum'),
('DAI', '0x6b175474e89094c44da98b954eedeac495271d0f', 'ethereum'),
('SHIB', '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', 'ethereum'),
('PEPE', '0x6982508145454ce325ddbe47a25d4ec3d2311933', 'ethereum'),
('WBTC', '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', 'ethereum'),
('AVAX', '0x85f138bfee4ef8e540890cfb48f620571d67eda3', 'ethereum'),
('MATIC', '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', 'ethereum'),
('DOT', '0x7083609fce4d1d8dc0c979aab8c869ea2c873402', 'ethereum'),
('ATOM', '0x8d983cb9388eac77af0474fa441c4815fd900a87', 'ethereum'),
('XRP', '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe', 'ethereum'),
('ADA', '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47', 'ethereum')
ON CONFLICT (symbol, chain) DO UPDATE SET 
  contract_address = EXCLUDED.contract_address;