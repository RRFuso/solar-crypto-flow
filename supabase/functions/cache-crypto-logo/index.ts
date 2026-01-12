import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol } = await req.json()
    if (!symbol) {
      throw new Error('Symbol is required')
    }

    console.log(`Caching logo for ${symbol}...`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if logo is already cached
    const { data: cached } = await supabase
      .from('cached_crypto_logos')
      .select('storage_path')
      .eq('symbol', symbol.toUpperCase())
      .single()

    if (cached) {
      // Update last accessed time
      await supabase
        .from('cached_crypto_logos')
        .update({ last_accessed: new Date().toISOString() })
        .eq('symbol', symbol.toUpperCase())

      const { data: publicUrl } = supabase.storage
        .from('crypto-logos')
        .getPublicUrl(cached.storage_path)

      return new Response(
        JSON.stringify({ 
          url: publicUrl.publicUrl,
          cached: true 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400' // 24 hours
          }
        }
      )
    }

    // Try to fetch logo from external sources
    const logoUrls = [
      `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`,
      `https://s3.coinmarketcap.com/generated/sparklines/web/7d/usd/${symbol.toLowerCase()}.png`,
      `https://cryptologos.cc/logos/${symbol.toLowerCase()}-logo.png`
    ]

    let logoBlob: Blob | null = null
    let sourceUrl = ''

    for (const url of logoUrls) {
      try {
        const response = await fetch(url)
        if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
          logoBlob = await response.blob()
          sourceUrl = url
          console.log(`Logo fetched from ${url}`)
          break
        }
      } catch (error) {
        console.log(`Failed to fetch from ${url}:`, error)
        continue
      }
    }

    if (!logoBlob) {
      console.log(`No logo found for ${symbol}, will use fallback`)
      return new Response(
        JSON.stringify({ 
          url: null,
          cached: false,
          fallback: true
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400'
          }
        }
      )
    }

    // Upload to Supabase Storage
    const storagePath = `${symbol.toUpperCase()}.png`
    const { error: uploadError } = await supabase.storage
      .from('crypto-logos')
      .upload(storagePath, logoBlob, {
        contentType: 'image/png',
        cacheControl: '86400', // 24 hours
        upsert: true
      })

    if (uploadError) {
      console.error(`Upload error for ${symbol}:`, uploadError)
      return new Response(
        JSON.stringify({ 
          url: null,
          cached: false,
          fallback: true,
          error: uploadError.message
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json'
          },
          status: 500
        }
      )
    }

    // Save metadata
    await supabase
      .from('cached_crypto_logos')
      .upsert({
        symbol: symbol.toUpperCase(),
        storage_path: storagePath,
        source_url: sourceUrl
      })

    const { data: publicUrl } = supabase.storage
      .from('crypto-logos')
      .getPublicUrl(storagePath)

    console.log(`Logo cached successfully for ${symbol}`)

    return new Response(
      JSON.stringify({ 
        url: publicUrl.publicUrl,
        cached: false 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400'
        }
      }
    )
  } catch (error: unknown) {
    console.error('Error caching logo:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    )
  }
})
