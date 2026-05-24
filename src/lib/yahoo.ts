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
      // Filter out non-investable types (currencies, futures, options...)
      return null
  }
}

export async function searchAssets(query: string): Promise<YahooResult[]> {
  const url = `/api/yahoo/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&region=US&quotesCount=10&newsCount=0`

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
      currency: q.currency || 'USD',
    }))
}

export async function upsertAsset(asset: YahooResult): Promise<Asset> {
  const { supabase } = await import('@/lib/supabase')

  // Use upsert to avoid race condition between check and insert
  const { data, error } = await supabase
    .from('assets')
    .upsert({
      symbol: asset.symbol,
      name: asset.name,
      asset_type: asset.asset_type,
      currency: asset.currency,
      active: true,
    }, { onConflict: 'symbol' })
    .select('id')
    .single()

  if (error) throw error
  return { id: (data as { id: string }).id, ...asset, active: true }
}
