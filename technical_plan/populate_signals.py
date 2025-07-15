
import os
from supabase import create_client, Client
from binance.client import Client as BinanceClient
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://bahshstcztvqmxiubslx.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaHNoc3RjenR2cW14aXVic2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDk3OTAsImV4cCI6MjA2MzkyNTc5MH0.b1S3ABBoaqa6P63piIF_jJXtf9TAgKv37wf50Q4yBvA")

# Binance API credentials (optional, for real-time data, but not strictly needed for public data)
# BINANCE_API_KEY = os.getenv("BINANCE_API_KEY")
# BINANCE_API_SECRET = os.getenv("BINANCE_API_SECRET")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Initialize Binance client (no API key/secret needed for public endpoints)
binance_client = BinanceClient("", "")

async def fetch_binance_tickers():
    """Fetches 24hr ticker data from Binance."""
    try:
        tickers = binance_client.get_ticker()
        return {t['symbol']: t for t in tickers}
    except Exception as e:
        print(f"Error fetching Binance tickers: {e}")
        return {}

async def populate_price_action_signals():
    """
    Fetches Binance data, calculates explosive potential, and upserts to Supabase.
    """
    print("Fetching Binance ticker data...")
    tickers_data = await fetch_binance_tickers()
    print(f"Fetched {len(tickers_data)} tickers.")

    signals_to_upsert = []
    
    # Define a list of symbols to check (you can expand this)
    # Using some common symbols for demonstration
    symbols_to_check = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT", "ADAUSDT", "SHIBUSDT", "AVAXUSDT", "DOTUSDT", "PEPEUSDT", "WIFUSDT", "BONKUSDT"]

    for symbol in symbols_to_check:
        ticker = tickers_data.get(symbol)
        if not ticker:
            print(f"Skipping {symbol}: Ticker data not found.")
            continue

        try:
            volume24h = float(ticker.get('quoteVolume', 0)) # Using quoteVolume as a proxy for USD volume
            change24h = float(ticker.get('priceChangePercent', 0))

            explosive_potential = "None"
            if volume24h > 100_000_000 and change24h > 5:
                explosive_potential = "High"
            elif volume24h > 50_000_000 and change24h > 2:
                explosive_potential = "Medium"
            elif volume24h > 10_000_000 and change24h > 0.5:
                explosive_potential = "Low"

            signal_data = {
                "symbol": symbol.replace("USDT", ""), # Store just the crypto symbol
                "explosive_potential": explosive_potential,
                "is_breakout": False, # Placeholder
                "is_expansion": False, # Placeholder
                "is_accelerating": False, # Placeholder
                "last_updated": "now()" # Supabase function for current timestamp
            }
            signals_to_upsert.append(signal_data)
            print(f"Prepared signal for {symbol}: Explosive Potential = {explosive_potential}, Volume = {volume24h:.2f}, Change = {change24h:.2f}%")

        except ValueError as e:
            print(f"Error processing data for {symbol}: {e}")
        except Exception as e:
            print(f"An unexpected error occurred for {symbol}: {e}")

    if signals_to_upsert:
        print(f"Upserting {len(signals_to_upsert)} signals to Supabase...")
        try:
            # Use upsert to insert new records or update existing ones based on 'symbol'
            response = supabase.table("crypto_price_action_signals").upsert(signals_to_upsert, on_conflict="symbol").execute()
            if response.data:
                print("Upsert successful!")
            else:
                print("Upsert completed, but no data returned in response.")
        except Exception as e:
            print(f"Error during Supabase upsert: {e}")
    else:
        print("No signals to upsert.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(populate_price_action_signals())
