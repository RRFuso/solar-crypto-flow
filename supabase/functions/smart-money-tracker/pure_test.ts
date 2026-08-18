// Integration tests for processTransactionsToFlows.
//
// Run with:  deno test supabase/functions/smart-money-tracker/pure_test.ts
//
// These tests exercise the exact code path used by the edge function
// (index.ts delegates to ./pure.ts) without touching Redis or Supabase.

import {
  assert,
  assertEquals,
  assertAlmostEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  calculateConfidenceScore,
  processTransactionsToFlows,
  SMART_MONEY_CONFIDENCE_THRESHOLD,
  TransactionWithDetails,
  WalletPerformance,
} from "./pure.ts";

// ---------- helpers ----------
const EXCHANGE = "0x28c6c06298d514db089934071355e5743bf21d60"; // Binance
const WALLET_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const WALLET_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const EXTERN = "0xccccccccccccccccccccccccccccccccccccccccc".slice(0, 42);

function tx(overrides: Partial<TransactionWithDetails> = {}): TransactionWithDetails {
  return {
    hash: overrides.hash ?? "0xhash",
    from: overrides.from ?? WALLET_A,
    to: overrides.to ?? EXTERN,
    value: overrides.value ?? 1,
    valueUSD: overrides.valueUSD ?? 0, // recomputed inside processor via prices
    tokenSymbol: overrides.tokenSymbol ?? "ETH",
    gasPrice: overrides.gasPrice,
    gasUsed: overrides.gasUsed,
    isError: overrides.isError ?? false,
    walletAddress: overrides.walletAddress ?? WALLET_A,
    toExchange: overrides.toExchange ?? false,
    fromExchange: overrides.fromExchange ?? false,
    ...overrides,
  };
}

const exchangeSet = new Set([EXCHANGE.toLowerCase()]);
const prices: Record<string, number> = { ETH: 2000, WBTC: 60000, PEPE: 0.00001 };

// =====================================================================
// calculateConfidenceScore — weighted 0–100 model
// =====================================================================

Deno.test("confidence: bounded within [0, 100]", () => {
  const massive = tx({ valueUSD: 50_000_000, toExchange: true, gasPrice: 200 });
  const wp: WalletPerformance = { wallet_address: WALLET_A, impact_score: 100, profit_ratio: 5 };
  const c = calculateConfidenceScore(massive, 2000, wp, 100);
  assert(c.total >= 0 && c.total <= 100, `expected 0..100, got ${c.total}`);
});

Deno.test("confidence: tiny value + no wallet history stays below smart-money threshold", () => {
  // Just above the $50k significance filter but no other signals → low score.
  const t = tx({ valueUSD: 51_000 });
  const c = calculateConfidenceScore(t, 2000);
  assert(c.total < SMART_MONEY_CONFIDENCE_THRESHOLD, `expected <40, got ${c.total}`);
  assertEquals(c.isSmartMoney, false);
});

Deno.test("confidence: value dominates — a $10M tx from an unknown wallet crosses the threshold", () => {
  const t = tx({ valueUSD: 10_000_000, toExchange: true });
  const c = calculateConfidenceScore(t, 2000);
  // valueNorm ≈ 1 → 50pts, modifier (to-exchange + success) ≈ 15pts → ~65
  assert(c.total >= SMART_MONEY_CONFIDENCE_THRESHOLD);
  assert(c.total >= 60 && c.total <= 80, `expected ~65 total, got ${c.total}`);
});

Deno.test("confidence: high-impact wallet lifts a mid-sized tx above the threshold", () => {
  const wp: WalletPerformance = { wallet_address: WALLET_A, impact_score: 100, profit_ratio: 3 };
  const t = tx({ valueUSD: 200_000, toExchange: true });
  const c = calculateConfidenceScore(t, 2000, wp);
  assert(c.isSmartMoney, `expected smart money, got total=${c.total}`);
});

Deno.test("confidence: wallet score contribution is monotonic (higher impact ⇒ higher total)", () => {
  const base = tx({ valueUSD: 200_000, toExchange: true });
  const low = calculateConfidenceScore(base, 2000, undefined, 0);
  const mid = calculateConfidenceScore(base, 2000, undefined, 50);
  const high = calculateConfidenceScore(base, 2000, undefined, 100);
  assert(low.total < mid.total, `${low.total} < ${mid.total}`);
  assert(mid.total < high.total, `${mid.total} < ${high.total}`);
});

Deno.test("confidence: fallback to walletHistoricalImpact when no live performance", () => {
  const t = tx({ valueUSD: 200_000, toExchange: true });
  const withHist = calculateConfidenceScore(t, 2000, undefined, 90);
  const noSignal = calculateConfidenceScore(t, 2000, undefined, 0);
  assert(withHist.total > noSignal.total);
});

// =====================================================================
// processTransactionsToFlows — direction mapping (no-data vs neutral)
// =====================================================================

Deno.test("flows: bearish when net flow into exchanges dominates (ratio < -0.2)", async () => {
  const txs: TransactionWithDetails[] = [
    // 3M ETH deposit into Binance from a high-impact wallet
    tx({ value: 1500, tokenSymbol: "ETH", to: EXCHANGE, walletAddress: WALLET_A, gasPrice: 80 }),
  ];
  const perf = new Map<string, WalletPerformance>([
    [WALLET_A, { wallet_address: WALLET_A, impact_score: 90, profit_ratio: 2 }],
  ]);

  const flows = await processTransactionsToFlows(txs, exchangeSet, prices, perf);
  const eth = flows.get("ETH");
  assert(eth, "expected ETH flow entry");
  assertEquals(eth.dominantDirection, "bearish");
  assert(eth.netFlowUSD < 0);
});

Deno.test("flows: bullish when net flow out of exchanges dominates (ratio > 0.2)", async () => {
  const txs: TransactionWithDetails[] = [
    tx({ value: 1500, tokenSymbol: "ETH", from: EXCHANGE, to: WALLET_A, walletAddress: WALLET_A, gasPrice: 80 }),
  ];
  const perf = new Map<string, WalletPerformance>([
    [WALLET_A, { wallet_address: WALLET_A, impact_score: 90, profit_ratio: 2 }],
  ]);

  const flows = await processTransactionsToFlows(txs, exchangeSet, prices, perf);
  const eth = flows.get("ETH");
  assert(eth, "expected ETH flow entry");
  assertEquals(eth.dominantDirection, "bullish");
  assert(eth.netFlowUSD > 0);
});

Deno.test("flows: neutral when inflow ≈ outflow (|ratio| ≤ 0.2)", async () => {
  const perf = new Map<string, WalletPerformance>([
    [WALLET_A, { wallet_address: WALLET_A, impact_score: 90, profit_ratio: 2 }],
    [WALLET_B, { wallet_address: WALLET_B, impact_score: 90, profit_ratio: 2 }],
  ]);
  const txs: TransactionWithDetails[] = [
    tx({ hash: "0x1", value: 1500, tokenSymbol: "ETH", to: EXCHANGE, walletAddress: WALLET_A, gasPrice: 80 }),
    tx({ hash: "0x2", value: 1500, tokenSymbol: "ETH", from: EXCHANGE, to: WALLET_B, walletAddress: WALLET_B, gasPrice: 80 }),
  ];

  const flows = await processTransactionsToFlows(txs, exchangeSet, prices, perf);
  const eth = flows.get("ETH");
  assert(eth, "expected ETH flow entry");
  assertEquals(eth.dominantDirection, "neutral");
  assertAlmostEquals(eth.netFlowUSD, 0, 1);
});

Deno.test("flows: no-data — symbol without a price is dropped (never appears as neutral)", async () => {
  // UNKNOWN has no price entry → valueUSD = 0 → below significance → skipped entirely.
  const txs: TransactionWithDetails[] = [
    tx({ value: 1_000_000, tokenSymbol: "UNKNOWN", to: EXCHANGE, walletAddress: WALLET_A }),
  ];
  const perf = new Map<string, WalletPerformance>();

  const flows = await processTransactionsToFlows(txs, exchangeSet, prices, perf);
  assertEquals(flows.has("UNKNOWN"), false);
  assertEquals(flows.size, 0);
});

Deno.test("flows: low-confidence txs are filtered — no flow entry created", async () => {
  // Value just above $50k, no wallet history, no exchange interaction → confidence < 40.
  const txs: TransactionWithDetails[] = [
    tx({ value: 30, tokenSymbol: "ETH", walletAddress: WALLET_A }), // $60k, both parties non-exchange
  ];
  const flows = await processTransactionsToFlows(txs, exchangeSet, prices, new Map());
  assertEquals(flows.has("ETH"), false);
});

// =====================================================================
// processTransactionsToFlows — value-weighted confidence (0–100)
// =====================================================================

Deno.test("aggregation: final confidenceScore is a value-weighted mean (0–100)", async () => {
  // Two ETH deposits with vastly different sizes; the larger one should dominate.
  const perf = new Map<string, WalletPerformance>([
    [WALLET_A, { wallet_address: WALLET_A, impact_score: 20, profit_ratio: 1 }], // low
    [WALLET_B, { wallet_address: WALLET_B, impact_score: 100, profit_ratio: 5 }], // high
  ]);
  const txs: TransactionWithDetails[] = [
    // Small tx from a low-impact wallet
    tx({ hash: "0x1", value: 100, tokenSymbol: "ETH", to: EXCHANGE, walletAddress: WALLET_A }), // $200k
    // Huge tx from a high-impact wallet
    tx({ hash: "0x2", value: 5000, tokenSymbol: "ETH", to: EXCHANGE, walletAddress: WALLET_B, gasPrice: 120 }), // $10M
  ];

  const flows = await processTransactionsToFlows(txs, exchangeSet, prices, perf);
  const eth = flows.get("ETH")!;

  // Bounded 0..100
  assert(eth.confidenceScore >= 0 && eth.confidenceScore <= 100, `got ${eth.confidenceScore}`);

  // The tiny tx alone would score much lower than the whale tx alone.
  // A simple average would sit around ~50; a weighted mean should be close to the whale's score.
  const small = calculateConfidenceScore(
    { ...txs[0], valueUSD: 200_000, toExchange: true },
    2000,
    perf.get(WALLET_A),
  );
  const big = calculateConfidenceScore(
    { ...txs[1], valueUSD: 10_000_000, toExchange: true },
    2000,
    perf.get(WALLET_B),
  );

  assert(
    Math.abs(eth.confidenceScore - big.total) < Math.abs(eth.confidenceScore - small.total),
    `weighted mean (${eth.confidenceScore}) should be closer to whale (${big.total}) than to small tx (${small.total})`,
  );

  // Simple mean would be:
  const simpleMean = (small.total + big.total) / 2;
  assert(
    eth.confidenceScore > simpleMean,
    `weighted mean ${eth.confidenceScore} should exceed simple mean ${simpleMean} when the whale scores higher`,
  );
});

Deno.test("aggregation: confidenceFactors are averaged (weighted), each within 0–100", async () => {
  const perf = new Map<string, WalletPerformance>([
    [WALLET_A, { wallet_address: WALLET_A, impact_score: 80, profit_ratio: 3 }],
  ]);
  const txs: TransactionWithDetails[] = [
    tx({ hash: "0x1", value: 500, tokenSymbol: "ETH", to: EXCHANGE, walletAddress: WALLET_A, gasPrice: 80 }),
    tx({ hash: "0x2", value: 2000, tokenSymbol: "ETH", to: EXCHANGE, walletAddress: WALLET_A, gasPrice: 80 }),
  ];
  const flows = await processTransactionsToFlows(txs, exchangeSet, prices, perf);
  const eth = flows.get("ETH")!;

  for (const [name, v] of Object.entries(eth.confidenceFactors)) {
    assert(v >= 0 && v <= 100, `factor ${name} out of range: ${v}`);
  }

  // Sanity: confidenceScore is not an unbounded sum (previous additive bug capped-only via Math.min).
  // Two whale txs alone must not push the score to 100.
  assert(eth.confidenceScore < 100);
});

Deno.test("aggregation: impactByAddr fallback participates in the weighted mean", async () => {
  const impactByAddr = new Map<string, number>([[WALLET_A, 100]]);
  const txs: TransactionWithDetails[] = [
    tx({ value: 500, tokenSymbol: "ETH", to: EXCHANGE, walletAddress: WALLET_A }),
  ];
  const withImpact = await processTransactionsToFlows(txs, exchangeSet, prices, new Map(), impactByAddr);
  const withoutImpact = await processTransactionsToFlows(txs, exchangeSet, prices, new Map());

  const a = withImpact.get("ETH");
  // Without wallet history the same tx may fail the smart-money gate → no entry.
  assert(a, "expected ETH flow when historical impact is present");
  if (withoutImpact.has("ETH")) {
    assert(a.confidenceScore > withoutImpact.get("ETH")!.confidenceScore);
  }
});

Deno.test("aggregation: whale count and intensity reflect real flows", async () => {
  const perf = new Map<string, WalletPerformance>([
    [WALLET_A, { wallet_address: WALLET_A, impact_score: 90, profit_ratio: 2 }],
  ]);
  const txs: TransactionWithDetails[] = [
    tx({ hash: "0x1", value: 1000, tokenSymbol: "ETH", to: EXCHANGE, walletAddress: WALLET_A }), // $2M whale
    tx({ hash: "0x2", value: 40, tokenSymbol: "ETH", to: EXCHANGE, walletAddress: WALLET_A }),   // $80k non-whale but significant
  ];
  const flows = await processTransactionsToFlows(txs, exchangeSet, prices, perf);
  const eth = flows.get("ETH")!;
  assertEquals(eth.whaleTxCount, 1);
  assert(eth.whaleTxValue >= 2_000_000);
  assert(eth.intensity > 0 && eth.intensity <= 100);
});

// =====================================================================
// Corroboration — a signal must be backed by several wallets/txs to be "high"
// =====================================================================

Deno.test("corroboration: single whale tx stays below the 70% high-confidence band", async () => {
  const flows = await processTransactionsToFlows(
    [tx({ value: 5000, from: EXCHANGE, fromExchange: true })], // $10M out of an exchange
    exchangeSet,
    prices,
    new Map(),
  );
  const eth = flows.get("ETH")!;
  assert(eth.confidenceScore < 70, `single tx should not reach 70, got ${eth.confidenceScore}`);
});

Deno.test("corroboration: many aligned whale txs from distinct wallets cross 70%", async () => {
  const wallets = [WALLET_A, WALLET_B, EXTERN, "0x1111111111111111111111111111111111111111", "0x2222222222222222222222222222222222222222"];
  const txs: TransactionWithDetails[] = [];
  for (let i = 0; i < 10; i++) {
    txs.push(tx({
      hash: `0xh${i}`,
      value: 2000, // $4M each
      from: EXCHANGE,
      fromExchange: true,
      walletAddress: wallets[i % wallets.length],
    }));
  }
  const flows = await processTransactionsToFlows(txs, exchangeSet, prices, new Map());
  const eth = flows.get("ETH")!;
  assertEquals(eth.dominantDirection, "bullish");
  assert(eth.confidenceScore > 70, `corroborated flow should exceed 70, got ${eth.confidenceScore}`);
  assert(eth.confidenceScore <= 100);
});

Deno.test("corroboration: conflicting flows (neutral) score lower than aligned flows", async () => {
  const mk = (aligned: boolean) => {
    const txs: TransactionWithDetails[] = [];
    for (let i = 0; i < 8; i++) {
      const outbound = aligned ? true : i % 2 === 0;
      txs.push(tx({
        hash: `0xc${i}`,
        value: 2000,
        from: outbound ? EXCHANGE : WALLET_A,
        to: outbound ? WALLET_A : EXCHANGE,
        fromExchange: outbound,
        toExchange: !outbound,
        walletAddress: i % 2 === 0 ? WALLET_A : WALLET_B,
      }));
    }
    return txs;
  };
  const alignedFlows = await processTransactionsToFlows(mk(true), exchangeSet, prices, new Map());
  const mixedFlows = await processTransactionsToFlows(mk(false), exchangeSet, prices, new Map());
  assert(
    alignedFlows.get("ETH")!.confidenceScore > mixedFlows.get("ETH")!.confidenceScore,
    "directional conviction must raise confidence",
  );
});
