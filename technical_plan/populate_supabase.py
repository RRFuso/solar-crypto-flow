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

    platform_map = {
        'binance-smart-chain': 'bsc',
        'ethereum': 'ethereum',
        # Add other platforms here as needed
    }

    inserted_count = 0
    for coin in coins:
        try:
            # Re-initialize client to avoid connection drops
            supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

            symbol = coin.get('symbol', '').upper()
            name = coin.get('name', '')
            coin_id = coin.get('id')

            if not symbol or not coin_id or not coin.get('platforms'):
                continue

            for platform_id, contract_address in coin['platforms'].items():
                if platform_id in platform_map and contract_address:
                    chain = platform_map[platform_id]

                    # Check if this specific symbol-chain combination already exists
                    response = supabase.from_('token_contracts').select('symbol').eq('symbol', symbol).eq('chain', chain).execute()
                    if response.data:
                        # print(f"Coin {symbol} on {chain} already exists. Skipping.")
                        continue

                    try:
                        data, count = supabase.from_('token_contracts').insert({
                            'symbol': symbol,
                            'contract_address': contract_address,
                            'chain': chain
                        }).execute()
                        inserted_count += 1
                        print(f"Inserted {symbol} ({name}) on {chain} with address {contract_address}")
                    except Exception as e:
                        if "duplicate key value violates unique constraint" in str(e):
                            # This can happen if symbols are not unique across chains in the source data
                            # print(f"Duplicate symbol {symbol} on {chain} encountered. Skipping.")
                            pass
                        else:
                            print(f"Error inserting {symbol} ({name}) on {chain}: {e}")
            
            time.sleep(0.1) # Be kind to the API
        except Exception as e:
            print(f"An error occurred in the main loop: {e}")
            time.sleep(5) # Wait before retrying

    print(f"Finished populating. Total inserted: {inserted_count}")

if __name__ == '__main__':
    populate_token_contracts()


