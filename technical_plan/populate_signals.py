
import os
from supabase import create_client, Client
from binance.client import Client as BinanceClient
from dotenv import load_dotenv
from dune_integration import DuneAPI, OnChainMetrics

# Load environment variables from .env file
load_dotenv()

# Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://bahshstcztvqmxiubslx.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaHNoc3RjenR2cW14aXVic2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDk3OTAsImV4cCI6MjA2MzkyNTc5MH0.b1S3ABBoaqa6P63piIF_jJXtf9TAgKv37wf50Q4yBvA")

# Binance API credentials (optional, for real-time data, but not strictly needed for public data)
# BINANCE_API_KEY = os.getenv("BINANCE_API_KEY")
# BINANCE_API_SECRET = os.getenv("BINANCE_API_SECRET")

# Dune Analytics API Key
DUNE_API_KEY = os.getenv("DUNE_API_KEY", "TM0cXgMp6XqZh5GfPZKRZFeNbSntspW0")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Initialize Binance client (no API key/secret needed for public endpoints)
binance_client = BinanceClient("", "")

# Initialize Dune Analytics client
dune_client = DuneAPI(DUNE_API_KEY)

async def fetch_binance_tickers():
    """Fetches 24hr ticker data from Binance."""
    try:
        tickers = binance_client.get_ticker()
        return {t['symbol']: t for t in tickers}
    except Exception as e:
        print(f"Error fetching Binance tickers: {e}")
        return {}

def calculate_explosive_potential_advanced(ticker, on_chain_metrics=None):
    """
    Calcula potencial explosivo usando critérios avançados
    """
    try:
        volume24h = float(ticker.get('quoteVolume', 0))
        change24h = float(ticker.get('priceChangePercent', 0))
        price = float(ticker.get('lastPrice', 0))
        high24h = float(ticker.get('highPrice', 0))
        low24h = float(ticker.get('lowPrice', 0))
        
        # Critérios base
        score = 0
        factors = []
        
        # 1. Volume (peso 25%)
        if volume24h > 100_000_000:
            score += 25
            factors.append("High Volume (>$100M)")
        elif volume24h > 50_000_000:
            score += 15
            factors.append("Medium Volume (>$50M)")
        elif volume24h > 10_000_000:
            score += 8
            factors.append("Low Volume (>$10M)")
            
        # 2. Price Action (peso 25%)
        if change24h > 10:
            score += 25
            factors.append(f"Strong Pump (+{change24h:.1f}%)")
        elif change24h > 5:
            score += 15
            factors.append(f"Good Pump (+{change24h:.1f}%)")
        elif change24h > 2:
            score += 8
            factors.append(f"Mild Pump (+{change24h:.1f}%)")
            
        # 3. Breakout detection (peso 20%)
        price_range = high24h - low24h
        if price_range > 0:
            position_in_range = (price - low24h) / price_range
            if position_in_range > 0.9:  # Preço próximo ao topo
                score += 20
                factors.append("Near 24h High")
            elif position_in_range > 0.8:
                score += 12
                factors.append("Above 80% Range")
                
        # 4. On-chain data integration (peso 30%)
        if on_chain_metrics:
            if on_chain_metrics.smart_money_sentiment == 'bullish':
                score += 15
                factors.append("Smart Money Bullish")
            if on_chain_metrics.whale_activity_score > 70:
                score += 10
                factors.append("High Whale Activity")
            if on_chain_metrics.accumulation_score > 60:
                score += 10
                factors.append("Accumulation Phase")
            if on_chain_metrics.exchange_flow_score < -50:  # Saída de exchanges
                score += 10
                factors.append("Exchange Outflow")
                
        # Classificação final
        if score >= 70:
            return "High", factors
        elif score >= 50:
            return "Medium", factors
        elif score >= 30:
            return "Low", factors
        else:
            return "None", factors
            
    except Exception as e:
        print(f"Erro ao calcular potencial explosivo: {e}")
        return "None", []

def calculate_edge_signals(ticker, on_chain_metrics=None):
    """
    Calcula sinais de borda (acumulação/distribuição)
    """
    try:
        volume24h = float(ticker.get('quoteVolume', 0))
        change24h = float(ticker.get('priceChangePercent', 0))
        
        signals = {
            "is_accumulation": False,
            "is_distribution": False,
            "accumulation_strength": 0,
            "distribution_strength": 0
        }
        
        # Sinal de Acumulação
        if (abs(change24h) < 3 and  # Preço consolidado
            volume24h > 5_000_000 and  # Volume mínimo
            on_chain_metrics and 
            on_chain_metrics.accumulation_score > 50):
            
            signals["is_accumulation"] = True
            signals["accumulation_strength"] = min(100, on_chain_metrics.accumulation_score + 20)
            
        # Sinal de Distribuição
        if (change24h > 5 and  # Preço subindo
            volume24h > 20_000_000 and  # Volume alto
            on_chain_metrics and 
            on_chain_metrics.distribution_score > 50):
            
            signals["is_distribution"] = True
            signals["distribution_strength"] = min(100, on_chain_metrics.distribution_score + 20)
            
        return signals
        
    except Exception as e:
        print(f"Erro ao calcular edge signals: {e}")
        return {"is_accumulation": False, "is_distribution": False, 
                "accumulation_strength": 0, "distribution_strength": 0}

async def populate_price_action_signals():
    """
    Fetches Binance data, integrates Dune Analytics on-chain data, 
    and calculates advanced explosive potential signals.
    """
    print("Fetching Binance ticker data...")
    tickers_data = await fetch_binance_tickers()
    print(f"Fetched {len(tickers_data)} tickers.")

    signals_to_upsert = []
    
    # Expanded list of symbols to check for better coverage
    symbols_to_check = [
        "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT", 
        "ADAUSDT", "SHIBUSDT", "AVAXUSDT", "DOTUSDT", "PEPEUSDT", "WIFUSDT", 
        "BONKUSDT", "MATICUSDT", "LINKUSDT", "UNIUSDT", "LTCUSDT", "BCHUSDT",
        "FILUSDT", "TRXUSDT", "APTUSDT", "NEARUSDT", "ATOMUSDT", "SANDUSDT",
        "MANAUSDT", "GALAUSDT", "CHZUSDT", "ENJUSDT", "AXSUSDT"
    ]
    
    # Cache para dados on-chain (para não fazer muitas chamadas à Dune)
    on_chain_cache = {}

    for symbol in symbols_to_check:
        ticker = tickers_data.get(symbol)
        if not ticker:
            print(f"Skipping {symbol}: Ticker data not found.")
            continue

        try:
            # Obter dados on-chain para símbolos importantes
            clean_symbol = symbol.replace("USDT", "")
            on_chain_metrics = None
            
            # Buscar dados on-chain para top coins (economizar API calls)
            if clean_symbol in ["BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "AVAX", "DOT", "LINK", "UNI"]:
                if clean_symbol not in on_chain_cache:
                    try:
                        print(f"Fetching on-chain data for {clean_symbol}...")
                        on_chain_metrics = dune_client.calculate_on_chain_metrics(clean_symbol)
                        on_chain_cache[clean_symbol] = on_chain_metrics
                    except Exception as e:
                        print(f"Failed to fetch on-chain data for {clean_symbol}: {e}")
                        on_chain_metrics = None
                else:
                    on_chain_metrics = on_chain_cache[clean_symbol]

            # Calcular potencial explosivo avançado
            explosive_potential, factors = calculate_explosive_potential_advanced(ticker, on_chain_metrics)
            
            # Calcular sinais de borda
            edge_signals = calculate_edge_signals(ticker, on_chain_metrics)
            
            # Detectar breakouts e expansões
            volume24h = float(ticker.get('quoteVolume', 0))
            change24h = float(ticker.get('priceChangePercent', 0))
            price = float(ticker.get('lastPrice', 0))
            high24h = float(ticker.get('highPrice', 0))
            low24h = float(ticker.get('lowPrice', 0))
            
            # Breakout detection
            price_range = high24h - low24h
            is_breakout = False
            if price_range > 0:
                position_in_range = (price - low24h) / price_range
                is_breakout = position_in_range > 0.9 and change24h > 3
            
            # Expansion detection (volume + price movement)
            is_expansion = volume24h > 30_000_000 and abs(change24h) > 5
            
            # Acceleration detection (strong momentum)
            is_accelerating = change24h > 8 and volume24h > 50_000_000

            signal_data = {
                "symbol": clean_symbol,
                "explosive_potential": explosive_potential,
                "is_breakout": is_breakout,
                "is_expansion": is_expansion,
                "is_accelerating": is_accelerating,
                "last_updated": "now()",
                # Novos campos para sinais avançados
                "factors": factors[:5] if factors else [],  # Limitar a 5 fatores
                "is_accumulation": edge_signals["is_accumulation"],
                "is_distribution": edge_signals["is_distribution"],
                "accumulation_strength": edge_signals["accumulation_strength"],
                "distribution_strength": edge_signals["distribution_strength"],
                "whale_activity": on_chain_metrics.whale_activity_score if on_chain_metrics else 0,
                "smart_money_sentiment": on_chain_metrics.smart_money_sentiment if on_chain_metrics else "neutral"
            }
            signals_to_upsert.append(signal_data)
            
            print(f"Prepared advanced signal for {symbol}:")
            print(f"  Explosive Potential: {explosive_potential}")
            print(f"  Factors: {factors}")
            print(f"  Breakout: {is_breakout}, Expansion: {is_expansion}, Accelerating: {is_accelerating}")
            print(f"  Accumulation: {edge_signals['is_accumulation']}, Distribution: {edge_signals['is_distribution']}")
            if on_chain_metrics:
                print(f"  Smart Money: {on_chain_metrics.smart_money_sentiment}, Whale Activity: {on_chain_metrics.whale_activity_score}")
            print(f"  Volume: ${volume24h:,.0f}, Change: {change24h:.2f}%")
            print("---")

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
