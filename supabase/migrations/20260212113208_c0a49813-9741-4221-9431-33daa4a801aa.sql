
-- Add unique constraint on wallet_address for upsert support
ALTER TABLE public.smart_money_wallets ADD CONSTRAINT smart_money_wallets_wallet_address_key UNIQUE (wallet_address);
