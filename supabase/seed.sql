-- ============================================================
-- Seed: Sample assets catalog
-- ============================================================

-- Stocks
insert into public.assets (symbol, name, asset_type, currency) values
  ('AAPL',  'Apple Inc.',                    'stock', 'USD'),
  ('MSFT',  'Microsoft Corporation',         'stock', 'USD'),
  ('GOOGL', 'Alphabet Inc.',                 'stock', 'USD'),
  ('AMZN',  'Amazon.com Inc.',               'stock', 'USD'),
  ('TSLA',  'Tesla Inc.',                    'stock', 'USD'),
  ('NVDA',  'NVIDIA Corporation',            'stock', 'USD'),
  ('META',  'Meta Platforms Inc.',           'stock', 'USD'),
  ('SAN',   'Banco Santander S.A.',          'stock', 'EUR'),
  ('TTE',   'TotalEnergies SE',              'stock', 'EUR'),
  ('AIR',   'Airbus SE',                     'stock', 'EUR')
on conflict (symbol) do nothing;

-- Crypto
insert into public.assets (symbol, name, asset_type, currency) values
  ('BTC',   'Bitcoin',                       'crypto', 'USD'),
  ('ETH',   'Ethereum',                      'crypto', 'USD'),
  ('SOL',   'Solana',                        'crypto', 'USD'),
  ('USDT',  'Tether',                        'crypto', 'USD'),
  ('USDC',  'USD Coin',                      'crypto', 'USD')
on conflict (symbol) do nothing;

-- ETFs
insert into public.assets (symbol, name, asset_type, currency) values
  ('VWCE',  'Vanguard FTSE All-World UCITS ETF',     'etf', 'EUR'),
  ('CSPX',  'iShares Core S&P 500 UCITS ETF',        'etf', 'USD'),
  ('IWDA',  'iShares Core MSCI World UCITS ETF',     'etf', 'EUR'),
  ('EQQQ',  'Invesco EQQQ Nasdaq-100 UCITS ETF',     'etf', 'EUR'),
  ('MEUD',  'Lyxor Core STOXX Europe 600 UCITS ETF', 'etf', 'EUR')
on conflict (symbol) do nothing;

-- Bonds
insert into public.assets (symbol, name, asset_type, currency) values
  ('AGG',   'iShares Core US Aggregate Bond ETF', 'bond', 'USD'),
  ('BND',   'Vanguard Total Bond Market ETF',     'bond', 'USD')
on conflict (symbol) do nothing;

-- Commodities
insert into public.assets (symbol, name, asset_type, currency) values
  ('XAU',   'Gold (Troy Ounce)',     'commodity', 'USD'),
  ('XAG',   'Silver (Troy Ounce)',   'commodity', 'USD'),
  ('CL',    'Crude Oil WTI',         'commodity', 'USD')
on conflict (symbol) do nothing;

-- Forex
insert into public.assets (symbol, name, asset_type, currency) values
  ('EURUSD', 'Euro / US Dollar',     'forex', 'USD'),
  ('GBPUSD', 'British Pound / USD',  'forex', 'USD')
on conflict (symbol) do nothing;
