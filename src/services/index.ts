import eastmoney, { eastmoneySearchSuggest } from './eastmoney'
import hkstock from './hkstock'
import usstock from './usstock'

export interface StockData {
  code: string
  name: string
  market: 'A' | 'HK' | 'US'
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
  volume: number
  amount: number
}

export interface KLineData {
  date: string
  open: number
  close: number
  high: number
  low: number
  volume: number
  amount?: number
}

/**
 * 根据市场获取股票行情
 */
export async function getStockQuote(code: string, market: 'A' | 'HK' | 'US'): Promise<StockData | null> {
  switch (market) {
    case 'A':
      return eastmoney.getAStockQuote(code)
    case 'HK':
      return hkstock.getHKStockQuote(code)
    case 'US':
      return usstock.getUSStockQuote(code)
    default:
      return null
  }
}

/**
 * 根据市场获取 K 线数据
 */
export async function getStockKLine(code: string, market: 'A' | 'HK' | 'US', period: string = 'day'): Promise<KLineData[]> {
  switch (market) {
    case 'A':
      return eastmoney.getAStockKLine(code, period)
    case 'HK':
      return hkstock.getHKStockKLine(code, period)
    case 'US':
      return usstock.getUSStockKLine(code, period)
    default:
      return []
  }
}

/**
 * 获取股票基本面
 */
export async function getStockBasicInfo(code: string, market: 'A' | 'HK' | 'US') {
  switch (market) {
    case 'A':
      return eastmoney.getAStockBasicInfo(code)
    case 'US':
      return usstock.getUSStockBasicInfo(code)
    default:
      return null
  }
}

/**
 * 搜索股票
 */
export async function searchStock(keyword: string, market?: 'A' | 'HK' | 'US') {
  if (market === 'US') {
    return usstock.searchUSStock(keyword)
  }

  if (market === 'A') {
    return eastmoney.searchAStock(keyword)
  }

  if (market === 'HK') {
    return hkstock.searchHKStock(keyword)
  }

  const [rows, us] = await Promise.all([eastmoneySearchSuggest(keyword, 28), usstock.searchUSStock(keyword)])
  const seen = new Set<string>()
  const out: Array<{ code: string; name: string; market: 'A' | 'HK' | 'US'; type?: string }> = []

  for (const r of rows) {
    const k = `${r.market}-${r.code}`
    if (seen.has(k)) continue
    seen.add(k)
    if (r.market === 'A') {
      out.push({
        code: r.code,
        name: r.name,
        market: 'A',
        type: r.code.startsWith('6') ? 'SH' : 'SZ'
      })
    } else {
      out.push({ code: r.code, name: r.name, market: r.market })
    }
  }

  for (const u of us) {
    const k = `US-${u.code}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(u)
  }

  return out.slice(0, 25)
}

export { eastmoney, hkstock, usstock }