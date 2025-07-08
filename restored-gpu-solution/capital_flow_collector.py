#!/usr/bin/env python3
"""
Capital Flow Data Collector for Solar Crypto Flow

Este script coleta dados de fluxo de capital de diferentes fontes:
1. DefiLlama API (gratuita) - para dados de TVL e liquidez DeFi
2. CoinGecko API - para dados de volume e market cap
3. Simulação de dados de exchange flow (para demonstração)

O script processa e normaliza os dados para serem consumidos pelo aplicativo.
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging
from supabase import create_client, Client

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CapitalFlowCollector:
    def __init__(self, supabase_url: str, supabase_key: str):
        """
        Inicializa o coletor de dados de fluxo de capital.
        
        Args:
            supabase_url: URL do projeto Supabase
            supabase_key: Chave de serviço do Supabase
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Solar-Crypto-Flow/1.0'
        })
        
    def fetch_defi_protocols(self) -> List[Dict[str, Any]]:
        """
        Busca dados de protocolos DeFi da DefiLlama API.
        
        Returns:
            Lista de protocolos com dados de TVL
        """
        try:
            logger.info("Buscando dados de protocolos DeFi...")
            response = self.session.get('https://api.llama.fi/protocols')
            response.raise_for_status()
            
            protocols = response.json()
            logger.info(f"Encontrados {len(protocols)} protocolos DeFi")
            
            # Filtrar apenas os top 50 protocolos por TVL para evitar sobrecarga
            top_protocols = sorted(protocols, key=lambda x: x.get('tvl', 0), reverse=True)[:50]
            
            return top_protocols
            
        except Exception as e:
            logger.error(f"Erro ao buscar protocolos DeFi: {e}")
            return []
    
    def fetch_protocol_tvl_history(self, protocol_slug: str) -> Optional[Dict[str, Any]]:
        """
        Busca histórico de TVL de um protocolo específico.
        
        Args:
            protocol_slug: Slug do protocolo na DefiLlama
            
        Returns:
            Dados históricos de TVL ou None se erro
        """
        try:
            url = f'https://api.llama.fi/protocol/{protocol_slug}'
            response = self.session.get(url)
            response.raise_for_status()
            
            data = response.json()
            return data
            
        except Exception as e:
            logger.error(f"Erro ao buscar TVL do protocolo {protocol_slug}: {e}")
            return None
    
    def fetch_coingecko_market_data(self, token_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Busca dados de mercado do CoinGecko para tokens específicos.
        
        Args:
            token_ids: Lista de IDs de tokens no CoinGecko
            
        Returns:
            Lista de dados de mercado
        """
        try:
            logger.info(f"Buscando dados de mercado para {len(token_ids)} tokens...")
            
            # Dividir em chunks de 100 tokens (limite da API)
            chunks = [token_ids[i:i+100] for i in range(0, len(token_ids), 100)]
            all_data = []
            
            for chunk in chunks:
                ids_str = ','.join(chunk)
                url = 'https://api.coingecko.com/api/v3/coins/markets'
                params = {
                    'vs_currency': 'usd',
                    'ids': ids_str,
                    'order': 'market_cap_desc',
                    'per_page': 100,
                    'page': 1,
                    'sparkline': False,
                    'price_change_percentage': '24h,7d'
                }
                
                response = self.session.get(url, params=params)
                response.raise_for_status()
                
                chunk_data = response.json()
                all_data.extend(chunk_data)
                
                # Rate limiting
                time.sleep(1)
            
            logger.info(f"Dados de mercado coletados para {len(all_data)} tokens")
            return all_data
            
        except Exception as e:
            logger.error(f"Erro ao buscar dados do CoinGecko: {e}")
            return []
    
    def simulate_exchange_flows(self, tokens: List[str]) -> List[Dict[str, Any]]:
        """
        Simula dados de fluxo de exchange para demonstração.
        Em produção, isso seria substituído por APIs reais como Glassnode ou CryptoQuant.
        
        Args:
            tokens: Lista de símbolos de tokens
            
        Returns:
            Lista de dados de fluxo simulados
        """
        import random
        
        logger.info("Gerando dados de fluxo de exchange simulados...")
        
        flows = []
        exchanges = ['binance', 'coinbase', 'kraken', 'okx', 'bybit']
        
        for token in tokens[:20]:  # Limitar a 20 tokens para demonstração
            for exchange in exchanges:
                # Simular inflow e outflow
                base_volume = random.uniform(1000000, 100000000)  # Volume base em USD
                
                inflow = base_volume * random.uniform(0.3, 0.7)
                outflow = base_volume * random.uniform(0.3, 0.7)
                netflow = inflow - outflow
                
                flow_data = {
                    'token': token,
                    'exchange': exchange,
                    'inflow_usd': inflow,
                    'outflow_usd': outflow,
                    'netflow_usd': netflow,
                    'timestamp': datetime.now().isoformat(),
                    'flow_direction': 'inflow' if netflow > 0 else 'outflow',
                    'flow_magnitude': abs(netflow),
                    'confidence_score': random.uniform(0.7, 0.95)
                }
                
                flows.append(flow_data)
        
        logger.info(f"Gerados {len(flows)} registros de fluxo simulados")
        return flows
    
    def calculate_capital_flows(self, defi_data: List[Dict], market_data: List[Dict], 
                              exchange_flows: List[Dict]) -> List[Dict[str, Any]]:
        """
        Calcula e normaliza os fluxos de capital entre tokens.
        
        Args:
            defi_data: Dados de protocolos DeFi
            market_data: Dados de mercado
            exchange_flows: Dados de fluxo de exchange
            
        Returns:
            Lista de fluxos de capital processados
        """
        logger.info("Calculando fluxos de capital...")
        
        capital_flows = []
        
        # Criar mapeamento de tokens por market cap para determinar fluxos
        market_map = {item['symbol'].upper(): item for item in market_data}
        
        # Processar fluxos DeFi
        for protocol in defi_data:
            if 'tvl' in protocol and protocol['tvl'] > 1000000:  # TVL > 1M
                # Simular fluxo baseado em mudança de TVL
                tvl_change = protocol.get('change_1d', 0)
                
                if abs(tvl_change) > 1:  # Mudança significativa
                    flow = {
                        'from_token': 'USD',
                        'to_token': protocol.get('symbol', protocol['name'][:10]).upper(),
                        'flow_type': 'defi_tvl',
                        'amount_usd': abs(tvl_change * protocol['tvl'] / 100),
                        'direction': 'inflow' if tvl_change > 0 else 'outflow',
                        'timestamp': datetime.now().isoformat(),
                        'source': 'defi_llama',
                        'confidence': 0.8
                    }
                    capital_flows.append(flow)
        
        # Processar fluxos de exchange
        for flow in exchange_flows:
            if abs(flow['netflow_usd']) > 100000:  # Fluxo significativo > 100k
                capital_flow = {
                    'from_token': flow['exchange'].upper(),
                    'to_token': flow['token'].upper(),
                    'flow_type': 'exchange_flow',
                    'amount_usd': flow['flow_magnitude'],
                    'direction': flow['flow_direction'],
                    'timestamp': flow['timestamp'],
                    'source': 'exchange_simulation',
                    'confidence': flow['confidence_score']
                }
                capital_flows.append(capital_flow)
        
        # Processar fluxos baseados em volume de mercado
        for token_data in market_data:
            if token_data['total_volume'] > 10000000:  # Volume > 10M
                symbol = token_data['symbol'].upper()
                price_change = token_data.get('price_change_percentage_24h', 0)
                
                if abs(price_change) > 5:  # Mudança de preço > 5%
                    # Simular fluxo baseado em momentum de preço
                    flow_amount = token_data['total_volume'] * abs(price_change) / 100
                    
                    capital_flow = {
                        'from_token': 'MARKET',
                        'to_token': symbol,
                        'flow_type': 'price_momentum',
                        'amount_usd': flow_amount,
                        'direction': 'inflow' if price_change > 0 else 'outflow',
                        'timestamp': datetime.now().isoformat(),
                        'source': 'coingecko',
                        'confidence': 0.7
                    }
                    capital_flows.append(capital_flow)
        
        logger.info(f"Calculados {len(capital_flows)} fluxos de capital")
        return capital_flows
    
    def store_capital_flows(self, flows: List[Dict[str, Any]]) -> bool:
        """
        Armazena os fluxos de capital no Supabase.
        
        Args:
            flows: Lista de fluxos de capital
            
        Returns:
            True se sucesso, False caso contrário
        """
        try:
            logger.info(f"Armazenando {len(flows)} fluxos de capital no Supabase...")
            
            # Criar tabela se não existir
            self.create_capital_flows_table()
            
            # Inserir dados em batches
            batch_size = 100
            for i in range(0, len(flows), batch_size):
                batch = flows[i:i+batch_size]
                
                result = self.supabase.table('capital_flows').insert(batch).execute()
                
                if hasattr(result, 'error') and result.error:
                    logger.error(f"Erro ao inserir batch: {result.error}")
                    return False
            
            logger.info("Fluxos de capital armazenados com sucesso")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao armazenar fluxos de capital: {e}")
            return False
    
    def create_capital_flows_table(self):
        """
        Cria a tabela de fluxos de capital no Supabase se não existir.
        """
        try:
            # Verificar se a tabela existe tentando fazer uma consulta
            result = self.supabase.table('capital_flows').select('*').limit(1).execute()
            logger.info("Tabela capital_flows já existe")
            
        except Exception:
            logger.info("Tabela capital_flows não existe, será necessário criá-la manualmente")
            # Em um ambiente real, você criaria a tabela via SQL no painel do Supabase
    
    def run_collection(self) -> Dict[str, Any]:
        """
        Executa o processo completo de coleta de dados.
        
        Returns:
            Relatório do processo de coleta
        """
        start_time = datetime.now()
        logger.info("Iniciando coleta de dados de fluxo de capital...")
        
        # 1. Buscar dados DeFi
        defi_protocols = self.fetch_defi_protocols()
        
        # 2. Extrair tokens principais para buscar dados de mercado
        token_symbols = []
        for protocol in defi_protocols[:20]:  # Top 20 protocolos
            if 'symbol' in protocol:
                token_symbols.append(protocol['symbol'].lower())
        
        # Adicionar tokens principais manualmente
        major_tokens = ['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana', 
                       'polkadot', 'dogecoin', 'avalanche-2', 'chainlink', 'polygon']
        token_symbols.extend(major_tokens)
        token_symbols = list(set(token_symbols))  # Remover duplicatas
        
        # 3. Buscar dados de mercado
        market_data = self.fetch_coingecko_market_data(token_symbols)
        
        # 4. Simular dados de exchange flow
        exchange_symbols = [item['symbol'].upper() for item in market_data[:20]]
        exchange_flows = self.simulate_exchange_flows(exchange_symbols)
        
        # 5. Calcular fluxos de capital
        capital_flows = self.calculate_capital_flows(defi_protocols, market_data, exchange_flows)
        
        # 6. Armazenar dados
        storage_success = self.store_capital_flows(capital_flows)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        report = {
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'duration_seconds': duration,
            'defi_protocols_collected': len(defi_protocols),
            'market_data_collected': len(market_data),
            'exchange_flows_simulated': len(exchange_flows),
            'capital_flows_calculated': len(capital_flows),
            'storage_success': storage_success,
            'status': 'success' if storage_success else 'partial_failure'
        }
        
        logger.info(f"Coleta concluída em {duration:.2f} segundos")
        logger.info(f"Status: {report['status']}")
        
        return report

def main():
    """
    Função principal para executar o coletor.
    """
    # Configurações do Supabase
    SUPABASE_URL = "https://bahshstcztvqmxiubslx.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaHNoc3RjenR2cW14aXVic2x4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0OTc5MCwiZXhwIjoyMDYzOTI1NzkwfQ.IqjJdvQbywC78qJV0oz4T9H8iMZ6BeiF6lF1svoszYo"
    
    # Inicializar coletor
    collector = CapitalFlowCollector(SUPABASE_URL, SUPABASE_KEY)
    
    # Executar coleta
    report = collector.run_collection()
    
    # Salvar relatório
    with open('capital_flow_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"Coleta concluída. Relatório salvo em capital_flow_report.json")
    print(f"Status: {report['status']}")
    print(f"Fluxos de capital calculados: {report['capital_flows_calculated']}")

if __name__ == "__main__":
    main()

