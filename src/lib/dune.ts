
import { DuneClient } from "@cowprotocol/ts-dune-client";
import { WhaleTransaction, ExchangeFlow } from '@/types/onchain';

const DUNE_API_KEY = "dvS5kNTGv8egXIGM6xml0TujWfJhBIGR";
const dune = new DuneClient(DUNE_API_KEY);

// Replace with your actual Dune query IDs
const WHALE_TRANSACTION_QUERY_ID = 12345; 
const EXCHANGE_FLOW_QUERY_ID = 67890;

export async function fetchOnChainDataFromDune(symbols: string[]): Promise<Map<string, { whaleTransactions: WhaleTransaction[], exchangeFlow: ExchangeFlow | null }>> {
    const results = new Map<string, { whaleTransactions: WhaleTransaction[], exchangeFlow: ExchangeFlow | null }>();

    for (const symbol of symbols) {
        try {
            // Fetch whale transactions
            const whaleParams = [{ key: "symbol", value: symbol, type: "string" }];
            const { result: whaleResult } = await dune.execute(WHALE_TRANSACTION_QUERY_ID, whaleParams);

            const whaleTransactions: WhaleTransaction[] = whaleResult?.rows.map((row: any) => ({
                hash: row.hash,
                timestamp: new Date(row.timestamp).getTime(),
                from: row.from,
                to: row.to,
                amount: row.amount,
                symbol: symbol,
                tokenPriceUSD: row.tokenPriceUSD
            })) || [];

            // Fetch exchange flow
            const exchangeParams = [{ key: "symbol", value: symbol, type: "string" }];
            const { result: exchangeResult } = await dune.execute(EXCHANGE_FLOW_QUERY_ID, exchangeParams);
            
            let exchangeFlow: ExchangeFlow | null = null;
            if (exchangeResult?.rows.length > 0) {
                const row = exchangeResult.rows[0];
                exchangeFlow = {
                    symbol: symbol,
                    timestamp: new Date(row.timestamp).getTime(),
                    netFlow: row.netFlow,
                    inflow: row.inflow,
                    outflow: row.outflow
                };
            }

            results.set(symbol, { whaleTransactions, exchangeFlow });

        } catch (error) {
            console.error(`Error fetching on-chain data for ${symbol} from Dune:`, error);
            results.set(symbol, { whaleTransactions: [], exchangeFlow: null });
        }
    }

    return results;
}
