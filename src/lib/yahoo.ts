import type { Asset } from '@/types/portfolio'

export interface YahooResult {
  symbol: string
  name: string
  asset_type: string
  currency: string
}

interface YahooQuote {
  symbol: string
  shortname?: string
  longname?: string
  quoteType?: string
  currency?: string
  exchange?: string
}

function inferAssetType(quoteType?: string): string | null {
  switch (quoteType) {
    case 'EQUITY':
      return 'stock'
    case 'CRYPTOCURRENCY':
      return 'crypto'
    case 'ETF':
      return 'etf'
    case 'MUTUALFUND':
      return 'etf'
    case 'INDEX':
      return 'etf'
    default:
      return null
  }
}

const EXCHANGE_CURRENCY: Record<string, string> = {
  '.MC': 'EUR', '.PA': 'EUR', '.DE': 'EUR', '.MI': 'EUR',
  '.AS': 'EUR', '.BR': 'EUR', '.LS': 'EUR',
  '.L': 'GBP', '.SW': 'CHF',
  '.TO': 'CAD', '.V': 'CAD',
  '.T': 'JPY', '.HK': 'HKD',
  '.AX': 'AUD', '.NZ': 'NZD',
  '.ST': 'SEK', '.CO': 'DKK', '.HE': 'EUR',
  '.SA': 'BRL',
}

function inferCurrency(symbol: string, apiCurrency?: string, assetType?: string | null): string {
  if (apiCurrency) return apiCurrency

  // Crypto pairs like BTC-EUR, ETH-USD → currency is the part after dash
  if (assetType === 'crypto') {
    const parts = symbol.split('-')
    if (parts.length === 2) return parts[1]
  }

  // Stock/ETF exchange suffix
  const suffix = symbol.match(/\.[A-Z]+$/)?.[0]
  return suffix ? (EXCHANGE_CURRENCY[suffix] || 'USD') : 'USD'
}

export async function searchAssets(query: string): Promise<YahooResult[]> {
  const url = `/api/yahoo/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&quotesCount=10&newsCount=0`

  const res = await fetch(url)
  if (!res.ok) return []

  const data = await res.json()
  const quotes: YahooQuote[] = data.quotes || []

  return quotes
    .filter((q) => q.symbol && (q.shortname || q.longname) && inferAssetType(q.quoteType) !== null)
    .map((q) => ({
      symbol: q.symbol,
      name: q.shortname || q.longname || q.symbol,
      asset_type: inferAssetType(q.quoteType)!,
      currency: inferCurrency(q.symbol, q.currency, inferAssetType(q.quoteType)),
    }))
}

export async function upsertAsset(asset: YahooResult): Promise<Asset> {
  const { supabase } = await import('@/lib/supabase')

  const { data: inserted, error: insertErr } = await supabase
    .from('assets')
    .insert({
      symbol: asset.symbol,
      name: asset.name,
      asset_type: asset.asset_type,
      currency: asset.currency,
    })
    .select('id')
    .single()

  if (!insertErr) {
    return { id: (inserted as { id: string }).id, ...asset, active: true }
  }

  const { data: existing } = await supabase
    .from('assets')
    .select('id')
    .eq('symbol', asset.symbol)
    .single()

  if (existing) {
    return { id: existing.id, ...asset, active: true }
  }

  throw insertErr
}

export async function fetchPrices(symbols: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {}

  await Promise.allSettled(
    symbols.map(async (symbol) => {
      const url = `/api/yahoo/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
      if (typeof price !== 'number') throw new Error('No price')
      prices[symbol] = price
    }),
  )

  return prices
}
