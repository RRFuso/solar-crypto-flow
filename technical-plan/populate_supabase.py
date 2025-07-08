from pycoingecko import CoinGeckoAPI
from supabase import create_client, Client
import time

SUPABASE_URL = 'https://bahshstcztvqmxiubslx.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaHNoc3RjenR2cW14aXVic2x4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0OTc5MCwiZXhwIjoyMDYzOTI1NzkwfQ.IqjJdvQbywC78qJV0oz4T9H8iMZ6BeiF6lF1svoszYo'

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
cg = CoinGeckoAPI()

def get_contract_address(coin_id, platform_id='ethereum'):
    try:
        coin_info = cg.get_coin_by_id(coin_id, localization=False, tickers=False, market_data=False, community_data=False, developer_data=False, sparkline=False)
        if coin_info and 'platforms' in coin_info and platform_id in coin_info['platforms']:
            return coin_info['platforms'][platform_id]
    except Exception as e:
        print(f"Error fetching contract address for {coin_id}: {e}")
    return None

def populate_token_contracts():
    print("Fetching coin list from CoinGecko...")
    coins = cg.get_coins_list(include_platform=True)
    print(f"Found {len(coins)} coins.")

    inserted_count = 0
    for coin in coins:
        symbol = coin.get('symbol', '').upper()
        name = coin.get('name', '')
        coin_id = coin.get('id')

        if not symbol or not coin_id:
            continue

        # Check if coin already exists in Supabase
        response = supabase.from_('token_contracts').select('symbol').eq('symbol', symbol).execute()
        if response.data:
            # print(f"Coin {symbol} already exists in Supabase. Skipping.")
            continue

        contract_address = None
        if 'platforms' in coin and 'ethereum' in coin['platforms']:
            contract_address = coin['platforms']['ethereum']
        
        if contract_address:
            try:
                data, count = supabase.from_('token_contracts').insert({
                    'symbol': symbol,
                    'contract_address': contract_address,
                    'chain': 'ethereum'
                }).execute()
                inserted_count += 1
                print(f"Inserted {symbol} ({name}) with address {contract_address}")
            except Exception as e:
                if "duplicate key value violates unique constraint" in str(e):
                    # This handles cases where the symbol might be duplicated but not caught by the initial select
                    # print(f"Duplicate symbol {symbol} encountered. Skipping.")
                    pass
                else:
                    print(f"Error inserting {symbol} ({name}): {e}")
        time.sleep(0.1) # Be kind to the API

    print(f"Finished populating. Total inserted: {inserted_count}")

if __name__ == '__main__':
    populate_token_contracts()


