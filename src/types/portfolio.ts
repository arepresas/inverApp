export interface PortfolioRow {
  user_id: string
  asset_id: string
  symbol: string
  name: string
  asset_type: string
  currency: string
  quantity: number
  average_cost: number
  total_invested: number
  currentPrice?: number | null
  currentValue?: number | null
  unrealizedPnl?: number | null
}

export interface Asset {
  id: string
  symbol: string
  name: string
  asset_type: string
  currency: string
  active?: boolean
}

export interface TransactionInput {
  asset_id: string
  transaction_type: 'buy' | 'sell'
  quantity: number
  price_per_unit: number
  fees: number
  transaction_date: string
  notes?: string
}

export interface WatchlistItem {
  id: string
  user_id: string
  asset_id: string
  symbol: string
  name: string
  asset_type: string
  currency: string
  created_at: string
  /** Runtime-only: populated from live price data, not stored */
  currentPrice?: number | null
}
