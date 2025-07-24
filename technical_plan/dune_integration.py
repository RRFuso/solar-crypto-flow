import requests
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class WhaleTransaction:
    """Representa uma transação de baleia identificada via Dune Analytics"""
    token_symbol: str
    from_address: str
    to_address: str
    amount: float
    usd_value: float
    timestamp: datetime
    transaction_hash: str
    is_exchange_related: bool

@dataclass
class ExchangeFlow:
    """Representa fluxos de entrada/saída de exchanges"""
    token_symbol: str
    net_flow: float  # Positivo = entrada, Negativo = saída
    inflow_volume: float
    outflow_volume: float
    exchange_name: str
    timeframe: str  # '1h', '4h', '24h'

@dataclass
class OnChainMetrics:
    """Métricas on-chain consolidadas"""
    token_symbol: str
    whale_activity_score: float  # 0-100
    exchange_flow_score: float   # -100 (saída) a +100 (entrada)
    accumulation_score: float    # 0-100
    distribution_score: float    # 0-100
    smart_money_sentiment: str   # 'bullish', 'bearish', 'neutral'

class DuneAPI:
    """Cliente para integração com Dune Analytics API"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.dune.com/api/v1"
        self.headers = {
            "X-Dune-API-Key": api_key,
            "Content-Type": "application/json"
        }
    
    def execute_query(self, query_id: int, parameters: Dict[str, Any] = None) -> Dict:
        """Executa uma query no Dune Analytics"""
        url = f"{self.base_url}/query/{query_id}/execute"
        
        payload = {}
        if parameters:
            payload["query_parameters"] = parameters
            
        response = requests.post(url, headers=self.headers, json=payload)
        
        if response.status_code != 200:
            raise Exception(f"Erro ao executar query: {response.status_code} - {response.text}")
            
        return response.json()
    
    def get_execution_status(self, execution_id: str) -> Dict:
        """Verifica o status de execução de uma query"""
        url = f"{self.base_url}/execution/{execution_id}/status"
        response = requests.get(url, headers=self.headers)
        
        if response.status_code != 200:
            raise Exception(f"Erro ao verificar status: {response.status_code} - {response.text}")
            
        return response.json()
    
    def get_execution_results(self, execution_id: str) -> Dict:
        """Obtém os resultados de uma query executada"""
        url = f"{self.base_url}/execution/{execution_id}/results"
        response = requests.get(url, headers=self.headers)
        
        if response.status_code != 200:
            raise Exception(f"Erro ao obter resultados: {response.status_code} - {response.text}")
            
        return response.json()

    def get_whale_transactions(self, token_symbol: str, hours: int = 24) -> List[WhaleTransaction]:
        """
        Obtém transações de baleias para um token específico
        Query ID fictício - deve ser substituído por query real do Dune
        """
        try:
            # Query ID fictício para whale transactions
            query_id = 12345  # Substituir por query real
            
            parameters = {
                "token_symbol": token_symbol.upper(),
                "hours": hours,
                "min_usd_value": 100000  # Mínimo $100k para considerar whale
            }
            
            # Executar query
            execution = self.execute_query(query_id, parameters)
            execution_id = execution.get("execution_id")
            
            # Aguardar conclusão (simplificado)
            results = self.get_execution_results(execution_id)
            
            whale_transactions = []
            for row in results.get("result", {}).get("rows", []):
                whale_transactions.append(WhaleTransaction(
                    token_symbol=row["token_symbol"],
                    from_address=row["from_address"],
                    to_address=row["to_address"],
                    amount=float(row["amount"]),
                    usd_value=float(row["usd_value"]),
                    timestamp=datetime.fromisoformat(row["timestamp"]),
                    transaction_hash=row["tx_hash"],
                    is_exchange_related=bool(row["is_exchange"])
                ))
            
            return whale_transactions
            
        except Exception as e:
            print(f"Erro ao obter whale transactions para {token_symbol}: {e}")
            return []

    def get_exchange_flows(self, token_symbol: str, timeframe: str = "24h") -> List[ExchangeFlow]:
        """
        Obtém fluxos de entrada/saída de exchanges para um token
        """
        try:
            # Query ID fictício para exchange flows
            query_id = 12346  # Substituir por query real
            
            parameters = {
                "token_symbol": token_symbol.upper(),
                "timeframe": timeframe
            }
            
            execution = self.execute_query(query_id, parameters)
            execution_id = execution.get("execution_id")
            results = self.get_execution_results(execution_id)
            
            exchange_flows = []
            for row in results.get("result", {}).get("rows", []):
                exchange_flows.append(ExchangeFlow(
                    token_symbol=row["token_symbol"],
                    net_flow=float(row["net_flow"]),
                    inflow_volume=float(row["inflow_volume"]),
                    outflow_volume=float(row["outflow_volume"]),
                    exchange_name=row["exchange_name"],
                    timeframe=timeframe
                ))
            
            return exchange_flows
            
        except Exception as e:
            print(f"Erro ao obter exchange flows para {token_symbol}: {e}")
            return []

    def calculate_on_chain_metrics(self, token_symbol: str) -> OnChainMetrics:
        """
        Calcula métricas on-chain consolidadas para um token
        """
        try:
            # Obter dados base
            whale_txs = self.get_whale_transactions(token_symbol, 24)
            exchange_flows = self.get_exchange_flows(token_symbol, "24h")
            
            # Calcular whale activity score
            whale_activity_score = min(100, len(whale_txs) * 10)
            
            # Calcular exchange flow score
            total_net_flow = sum(flow.net_flow for flow in exchange_flows)
            exchange_flow_score = max(-100, min(100, total_net_flow / 1000000))  # Normalizar
            
            # Calcular accumulation/distribution scores
            accumulation_score = 0
            distribution_score = 0
            
            for tx in whale_txs:
                if tx.is_exchange_related:
                    # Saída de exchange = acumulação
                    if "binance" in tx.from_address.lower() or "coinbase" in tx.from_address.lower():
                        accumulation_score += 10
                    # Entrada em exchange = distribuição
                    elif "binance" in tx.to_address.lower() or "coinbase" in tx.to_address.lower():
                        distribution_score += 10
            
            accumulation_score = min(100, accumulation_score)
            distribution_score = min(100, distribution_score)
            
            # Determinar sentiment
            if accumulation_score > distribution_score and exchange_flow_score < -20:
                smart_money_sentiment = "bullish"
            elif distribution_score > accumulation_score and exchange_flow_score > 20:
                smart_money_sentiment = "bearish"
            else:
                smart_money_sentiment = "neutral"
            
            return OnChainMetrics(
                token_symbol=token_symbol,
                whale_activity_score=whale_activity_score,
                exchange_flow_score=exchange_flow_score,
                accumulation_score=accumulation_score,
                distribution_score=distribution_score,
                smart_money_sentiment=smart_money_sentiment
            )
            
        except Exception as e:
            print(f"Erro ao calcular métricas on-chain para {token_symbol}: {e}")
            return OnChainMetrics(
                token_symbol=token_symbol,
                whale_activity_score=0,
                exchange_flow_score=0,
                accumulation_score=0,
                distribution_score=0,
                smart_money_sentiment="neutral"
            )