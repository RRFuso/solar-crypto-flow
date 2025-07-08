# Pesquisa e Identificação de Fontes de Dados de Fluxo de Capital On-Chain

Para capacitar o aplicativo "Solar Crypto Flow" a rastrear e apresentar o fluxo de capital entre os tokens de forma assertiva, é fundamental integrar-se a fontes de dados on-chain robustas e confiáveis. A pesquisa inicial focou em identificar APIs e provedores de dados que ofereçam insights sobre movimentos de capital, incluindo entradas/saídas de exchanges, transferências entre carteiras e dados de liquidez de protocolos DeFi.

Diversas plataformas se destacam nesse cenário, cada uma com suas particularidades e focos. Abaixo, detalhamos as opções mais relevantes e suas características para a finalidade do nosso projeto.

## 1. Glassnode

**Descrição:** Glassnode é uma plataforma líder em inteligência de mercado on-chain, oferecendo uma vasta gama de métricas e dados brutos diretamente da blockchain. Sua API é conhecida pela alta fidelidade e granularidade dos dados, sendo amplamente utilizada por analistas e instituições para estratégias de trading e modelos quantitativos [1].

**Relevância para o Projeto:**
- **Métricas de Fluxo:** Oferece métricas detalhadas sobre fluxos de exchange (inflow/outflow), suprimento em contratos inteligentes, saldos de mineradores, e muito mais. Essas métricas são cruciais para entender o movimento de capital para dentro e para fora de diferentes entidades e tokens.
- **Dados Históricos e em Tempo Real:** A API da Glassnode permite acesso a dados históricos extensos, bem como a dados quase em tempo real, o que é essencial para uma visualização dinâmica e responsiva.
- **Cobertura:** Abrange as principais criptomoedas como Bitcoin e Ethereum, além de stablecoins e altcoins selecionadas.

**Considerações:**
- **Custo:** A API da Glassnode é geralmente um serviço pago, com diferentes níveis de acesso dependendo da profundidade e frequência dos dados necessários. Para um uso contínuo e em larga escala, o custo pode ser um fator.
- **Complexidade:** A riqueza de dados pode exigir um certo nível de familiaridade com métricas on-chain para extrair os insights mais relevantes.

## 2. CryptoQuant

**Descrição:** CryptoQuant é outro provedor proeminente de dados on-chain e de mercado, focado em fornecer insights acionáveis para investidores. Eles oferecem uma plataforma abrangente com gráficos e dados para diversas criptomoedas [8, 11, 12].

**Relevância para o Projeto:**
- **Fluxos de Exchange:** Possui métricas específicas e detalhadas sobre fluxos de exchange (inflow, outflow, netflow) para Bitcoin, Ethereum, stablecoins e altcoins. Isso é diretamente aplicável ao nosso objetivo de rastrear o fluxo de capital.
- **Insights Acionáveis:** A plataforma é projetada para traduzir dados brutos em insights, o que pode simplificar a interpretação dos movimentos de capital.

**Considerações:**
- **API:** Embora ofereçam uma plataforma rica em dados, a disponibilidade e a granularidade da API para integração programática precisam ser avaliadas em detalhes. Algumas métricas podem ser mais acessíveis via interface de usuário do que via API.

## 3. The Block Crypto Data

**Descrição:** The Block é uma fonte de notícias, pesquisa e dados sobre o ecossistema de ativos digitais. Eles fornecem gráficos e dados avançados sobre fluxos de cripto, incluindo Bitcoin, Ethereum e Tether [13].

**Relevância para o Projeto:**
- **Dados de Fluxo Agregados:** Oferecem visualizações e dados sobre o fluxo de capital em um nível mais agregado, o que pode ser útil para identificar tendências macro.

**Considerações:**
- **Acesso à API:** É necessário verificar a disponibilidade de uma API para acesso programático aos seus dados de fluxo, pois o foco principal pode ser a plataforma de pesquisa e notícias.

## 4. Chainalysis

**Descrição:** Chainalysis é uma empresa de análise de blockchain que ajuda governos, empresas de criptomoedas e instituições financeiras a entender e rastrear o fluxo de fundos em blockchains. Eles são especializados em rastreamento de transações e atribuição de endereços [6, 7].

**Relevância para o Projeto:**
- **Rastreamento de Transações:** Sua expertise em rastrear o fluxo de fundos através de diferentes entidades (exchanges, mixers, DEXs) é extremamente valiosa para entender a origem e o destino do capital.
- **Dados Estruturados:** Eles estruturam dados on-chain complexos, tornando-os mais acessíveis para análise.

**Considerações:**
- **Foco:** O foco principal da Chainalysis é a conformidade e a investigação de crimes financeiros, o que significa que sua API pode ser mais orientada para esses casos de uso e menos para métricas de fluxo de capital de mercado em tempo real para visualizações.

## 5. Bitquery

**Descrição:** Bitquery oferece dados históricos e em tempo real para mais de 40 blockchains através de APIs GraphQL, Websockets e SQL. Eles se posicionam como uma plataforma abrangente para dados de blockchain e cripto [8, 10].

**Relevância para o Projeto:**
- **Ampla Cobertura de Blockchain:** Suporta um grande número de blockchains, o que é vantajoso para uma análise de fluxo de capital multi-chain.
- **APIs Flexíveis:** A oferta de APIs GraphQL e Websockets sugere flexibilidade para consultas complexas e atualizações em tempo real.
- **Dados DEX:** Possuem APIs específicas para dados de DEX (Decentralized Exchanges), incluindo pares de negociação, liquidez e preços de tokens, o que é crucial para entender o fluxo de capital em DeFi [10].

**Considerações:**
- **Curva de Aprendizagem:** A utilização de GraphQL pode exigir uma curva de aprendizado para desenvolvedores não familiarizados com essa tecnologia.

## 6. DefiLlama API

**Descrição:** DefiLlama é uma plataforma líder para dados de finanças descentralizadas (DeFi), agregando informações de TVL (Total Value Locked), volumes, pools de liquidez e muito mais em diversas blockchains e protocolos [2].

**Relevância para o Projeto:**
- **Dados de Liquidez DeFi:** Essencial para entender o fluxo de capital dentro do ecossistema DeFi, incluindo movimentos de liquidez entre pools e protocolos.
- **API Gratuita:** A DefiLlama oferece uma API pública e gratuita, o que é uma grande vantagem para o desenvolvimento inicial e testes.

**Considerações:**
- **Foco:** O foco é estritamente em DeFi, o que significa que não cobrirá fluxos de exchange centralizados ou métricas on-chain mais amplas.

## Conclusão da Pesquisa e Próximos Passos

Com base nesta pesquisa, **Glassnode** e **Bitquery** emergem como as opções mais promissoras para dados abrangentes de fluxo de capital on-chain e de exchange, respectivamente, devido à sua granularidade e flexibilidade de API. Para dados específicos de liquidez DeFi, a **DefiLlama API** é uma excelente opção complementar, especialmente por ser gratuita.

Para a próxima fase, a recomendação é focar na integração com uma ou mais dessas APIs para coletar os dados de fluxo de capital. Será necessário:

1.  **Aprofundar na Documentação:** Estudar a documentação das APIs selecionadas para entender os endpoints específicos para fluxo de capital e os modelos de dados.
2.  **Configurar Credenciais:** Obter chaves de API, se necessário, para as plataformas pagas.
3.  **Desenvolver o Mecanismo de Coleta:** Criar scripts ou serviços para consumir as APIs e extrair os dados relevantes.
4.  **Definir a Estrutura de Armazenamento:** Projetar como esses dados de fluxo de capital serão armazenados no Supabase (ou em um novo banco de dados/tabela) para serem facilmente acessíveis pelo aplicativo.

Esses passos permitirão a transição para a Fase 2 do plano, que é a coleta e processamento efetivo dos dados de fluxo de capital.

---
### Referências

[1] Glassnode. *On-chain market intelligence*. Disponível em: [https://glassnode.com/](https://glassnode.com/)
[2] DefiLlama. *DefiLlama API Docs*. Disponível em: [https://defillama.com/docs/api](https://defillama.com/docs/api)
[3] CoinDesk. *On-Chain DEX | CoinDesk Cryptocurrency Data API*. Disponível em: [https://developers.coindesk.com/documentation/data-api/on_chain_dex](https://developers.coindesk.com/documentation/data-api/on_chain_dex)
[4] The Block. *Crypto Flows Data and Charts for Bitcoin, Ethereum and Tether*. Disponível em: [https://www.theblock.co/data/on-chain-metrics/flows](https://www.theblock.co/data/on-chain-metrics/flows)
[5] CoinGlass. *Cryptocurrency Spot Flow Statistics*. Disponível em: [https://www.coinglass.com/spot-inflow-outflow](https://www.coinglass.com/spot-inflow-outflow)
[6] Chainalysis. *The Blockchain Data Platform*. Disponível em: [https://www.chainalysis.com/](https://www.chainalysis.com/)
[7] Moesif Blog. *Top 8 Blockchain APIs for Developers*. Disponível em: [https://www.moesif.com/blog/api-product-management/api-analytics/Top-8-Blockchain-APIs-For-Developers/](https://www.moesif.com/blog/api-product-management/api-analytics/Top-8-Blockchain-APIs-For-Developers/)
[8] Bitquery. *Blockchain API and Crypto Data Products*. Disponível em: [https://bitquery.io/](https://bitquery.io/)
[9] Amberdata. *Comprehensive Blockchain Data API*. Disponível em: [https://www.amberdata.io/blockchain-network](https://www.amberdata.io/blockchain-network)
[10] Bitquery. *DEX API for DeFi Developers: Live Prices & On-chain Market Data*. Disponível em: [https://bitquery.io/products/dex](https://bitquery.io/products/dex)
[11] CryptoQuant. *Bitcoin: Exchange Flows*. Disponível em: [https://cryptoquant.com/asset/btc/chart/exchange-flows](https://cryptoquant.com/asset/btc/chart/exchange-flows)
[12] CryptoQuant. *Bitcoin: Exchange Netflow (Total) - All Exchanges*. Disponível em: [https://cryptoquant.com/asset/btc/chart/exchange-flows/exchange-netflow-total](https://cryptoquant.com/asset/btc/chart/exchange-netflow-total)
[13] The Block. *Crypto Flows Data and Charts for Bitcoin, Ethereum and Tether*. Disponível em: [https://www.theblock.co/data/on-chain-metrics/flows](https://www.theblock.co/data/on-chain-metrics/flows)
[14] Medium. *Top 10 on-chain data APIs for developers*. Disponível em: [https://medium.com/coinmonks/top-10-on-chain-data-apis-for-developers-1fe76ecfeb31](https://medium.com/coinmonks/top-10-on-chain-data-apis-for-developers-1fe76ecfeb31)
[15] Medium. *Developing Automated Tracking Systems to Analyze Capital Flows ...*. Disponível em: [https://medium.com/o-m-n-i-exploring-our-technology-enabled-future/developing-automated-tracking-systems-to-analyze-capital-flows-in-real-time-ef2d8a5cec80](https://medium.com/o-m-n-i-exploring-our-technology-enabled-future/developing-automated-tracking-systems-to-analyze-capital-flows-in-real-time-ef2d8a5cec80)
[16] Alpaca. *On-Chain Metric Investing Strategy with Glassnode API*. Disponível em: [https://alpaca.markets/learn/on-chain-metric-investing-strategy-with-glassnodeapi](https://alpaca.markets/learn/on-chain-metric-investing-strategy-with-glassnodeapi)
[17] The Tie. *On-Chain Data*. Disponível em: [https://www.thetie.io/data/on-chain/](https://www.thetie.io/data/on-chain/)
[18] CoinMarketCap. *Live Cryptocurrency Charts & Market Data*. Disponível em: [https://coinmarketcap.com/charts/](https://coinmarketcap.com/charts/)
[19] Bookmap. *Analyze & Trade Order Flow Crypto Exchanges*. Disponível em: [https://bookmap.com/crypto](https://bookmap.com/crypto)
[20] Messari. *Top Crypto Exchanges by Volume*. Disponível em: [https://messari.io/exchanges](https://messari.io/exchanges)
[21] Blockchain.com. *Blockchain Developer APIs*. Disponível em: [https://www.blockchain.com/api](https://www.blockchain.com/api)
[22] Blockchain.com. *Blockchain Data API*. Disponível em: [https://www.blockchain.com/api/blockchain_api](https://www.blockchain.com/api/blockchain_api)
[23] Blockchain.com. *Blockchain Charts & Statistics API*. Disponível em: [https://www.blockchain.com/api/charts_api](https://www.blockchain.com/api/charts_api)
[24] Google Cloud. *Enable APIs | Blockchain Analytics*. Disponível em: [https://cloud.google.com/blockchain-analytics/docs/enable-apis](https://cloud.google.com/blockchain-analytics/docs/enable-apis)
[25] Blockdaemon. *Defi API | Single interface to multiple DeFi projects*. Disponível em: [https://www.blockdaemon.com/api/defi](https://www.blockdaemon.com/api/defi)
[26] Shyft. *DeFI APIs*. Disponível em: [https://docs.shyft.to/solana-defi-apis/defi-apis](https://docs.shyft.to/solana-defi-apis/defi-apis)
[27] Datamint. *DeFi Data Engine*. Disponível em: [https://datamint.ai/data-api](https://datamint.ai/data-api)
[28] De.Fi. *DeFi API - Integrate De.Fi's Crypto Data*. Disponível em: [https://de.fi/api](https://de.fi/api)
[29] Blockdaemon. *expand.network by Blockdaemon – A Unified DeFi API*. Disponível em: [https://www.expand.network/](https://www.expand.network/)
[30] Moralis. *How to Get Token Pairs & Liquidity Data with 1 API Call Using Moralis*. Disponível em: [https://docs.moralis.io/web3-data-api/evm/token-api/how-to-get-token-pairs-liquidity](https://docs.moralis.io/web3-data-api/evm/token-api/how-to-get-token-pairs-liquidity)
[31] GeckoTerminal. *DEX API for DeFi Developers: Live Prices & On-chain Market Data*. Disponível em: [https://www.geckoterminal.com/dex-api](https://www.geckoterminal.com/dex-api)
[32] CoinDesk Data. *Institutional Grade Digital Asset Data Solutions*. Disponível em: [https://data.coindesk.com/](https://data.coindesk.com/)
[33] Coinbase Developer Docs. *Welcome to Onchain Data*. Disponível em: [https://docs.cdp.coinbase.com/onchain-data/docs/welcome](https://docs.cdp.coinbase.com/onchain-data/docs/welcome)
[34] Coinbase Developer Docs. *Welcome to Onchain Reputation API*. Disponível em: [https://docs.cdp.coinbase.com/reputation/introduction/welcome](https://docs.cdp.coinbase.com/reputation/introduction/welcome)
[35] CryptoMeter.io. *Cryptocurrencies Money Flow*. Disponível em: [https://www.cryptometer.io/volume-flow](https://www.cryptometer.io/volume-flow)



