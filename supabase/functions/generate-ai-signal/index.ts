import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { cryptoId } = await req.json()

  // Lógica de IA (simulada por enquanto)
  const signals = ["buy", "sell", "hold"]
  const randomSignal = signals[Math.floor(Math.random() * signals.length)]
  const confidenceScore = Math.random()

  const data = {
    signal: randomSignal,
    confidence: confidenceScore,
  }

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})
