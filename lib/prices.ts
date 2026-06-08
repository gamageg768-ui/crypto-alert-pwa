// lib/prices.ts — Real-time price fetching for crypto & stocks
export interface PriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;   // percent
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  marketCap?: number;
  assetType: 'CRYPTO' | 'STOCK';
  timestamp: Date;
}

// ─────────────────────────────────────────
// CRYPTO — CoinGecko API
// ─────────────────────────────────────────
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Map popular tickers to CoinGecko IDs
const COINGECKO_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  MATIC: 'matic-network',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  LINK: 'chainlink',
  UNI: 'uniswap',
  LTC: 'litecoin',
  BCH: 'bitcoin-cash',
  ATOM: 'cosmos',
  NEAR: 'near',
  APT: 'aptos',
  OP: 'optimism',
  ARB: 'arbitrum',
  SUI: 'sui',
};

export async function fetchCryptoPrices(symbols: string[]): Promise<PriceData[]> {
  const ids = symbols
    .map(s => COINGECKO_ID_MAP[s.toUpperCase()] ?? s.toLowerCase())
    .join(',');

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (process.env.COINGECKO_API_KEY) {
    headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
  }

  const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=50&price_change_percentage=24h`;
  const res = await fetch(url, { headers, next: { revalidate: 15 } });

  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  const data = await res.json();

  // Map back by finding original symbol
  const reverseMap: Record<string, string> = {};
  for (const [sym, id] of Object.entries(COINGECKO_ID_MAP)) reverseMap[id] = sym;

  return data.map((coin: Record<string, unknown>) => ({
    symbol: reverseMap[coin.id as string] ?? (coin.symbol as string).toUpperCase(),
    name: coin.name as string,
    price: coin.current_price as number,
    change24h: coin.price_change_percentage_24h as number ?? 0,
    high24h: coin.high_24h as number,
    low24h: coin.low_24h as number,
    volume24h: coin.total_volume as number,
    marketCap: coin.market_cap as number,
    assetType: 'CRYPTO' as const,
    timestamp: new Date(),
  }));
}

// ─────────────────────────────────────────
// STOCKS — Alpha Vantage API
// ─────────────────────────────────────────
const AV_BASE = 'https://www.alphavantage.co/query';

export async function fetchStockPrice(symbol: string): Promise<PriceData | null> {
  const key = process.env.ALPHA_VANTAGE_KEY || 'demo';
  const url = `${AV_BASE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${key}`;
  const res = await fetch(url, { next: { revalidate: 30 } });

  if (!res.ok) return null;
  const data = await res.json();
  const quote = data['Global Quote'];
  if (!quote || !quote['05. price']) return null;

  const price = parseFloat(quote['05. price']);
  const prevClose = parseFloat(quote['08. previous close']);
  const change24h = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

  return {
    symbol: symbol.toUpperCase(),
    name: symbol.toUpperCase(),
    price,
    change24h,
    high24h: parseFloat(quote['03. high']),
    low24h: parseFloat(quote['04. low']),
    volume24h: parseFloat(quote['06. volume']),
    assetType: 'STOCK',
    timestamp: new Date(),
  };
}

export async function fetchStockPrices(symbols: string[]): Promise<PriceData[]> {
  const results = await Promise.allSettled(symbols.map(s => fetchStockPrice(s)));
  return results
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => (r as PromiseFulfilledResult<PriceData>).value);
}

// ─────────────────────────────────────────
// UNIFIED FETCHER
// ─────────────────────────────────────────
export async function fetchAllPrices(
  cryptoSymbols: string[],
  stockSymbols: string[]
): Promise<PriceData[]> {
  const [cryptos, stocks] = await Promise.allSettled([
    cryptoSymbols.length > 0 ? fetchCryptoPrices(cryptoSymbols) : Promise.resolve([]),
    stockSymbols.length > 0 ? fetchStockPrices(stockSymbols) : Promise.resolve([]),
  ]);

  const results: PriceData[] = [];
  if (cryptos.status === 'fulfilled') results.push(...cryptos.value);
  if (stocks.status === 'fulfilled') results.push(...stocks.value);
  return results;
}

// Popular default watchlists
export const DEFAULT_CRYPTOS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX'];
export const DEFAULT_STOCKS  = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'GOOGL', 'META', 'SPY'];
