import eastmoney from './eastmoney'
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
  if (market === 'A') {
    return eastmoney.searchAStock(keyword)
  } else if (market === 'HK') {
    return hkstock.searchHKStock(keyword)
  } else if (market === 'US') {
    return usstock.searchUSStock(keyword)
  }
  
  // 搜索所有市场
  const [a, hk, us] = await Promise.all([
    eastmoney.searchAStock(keyword),
    hkstock.searchHKStock(keyword),
    usstock.searchUSStock(keyword)
  ])
  
  return [...a, ...hk, ...us]
}

export { eastmoney, hkstock, usstock }