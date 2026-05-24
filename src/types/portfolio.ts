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
