import axios from 'axios'
import { eastmoneySearchSuggest } from './eastmoney'

/** Yahoo 港股代码一般为去掉前导零的整数 + .HK（如 01810 -> 1810.HK） */
export function hkSymbolForYahoo(stockCode: string): string {
  const n = parseInt(String(stockCode).replace(/\D/g, '') || '0', 10)
  return `${n}.HK`
}

/**
 * 获取港股实时行情（腾讯接口）
 * @param stockCode 股票代码，如 00700
 */
export async function getHKStockQuote(stockCode: string) {
  const tidy = String(stockCode).trim()
  const num = parseInt(tidy.replace(/\D/g, '') || '0', 10)
  const candidates = Array.from(new Set([tidy, String(num), String(num).padStart(5, '0')]))

  try {
    for (const c of candidates) {
      const response = await axios.get('https://qt.gtimg.cn/q', {
        params: { q: `hk${c}` },
        timeout: 10000
      })

      const data = response.data
      if (data && data.includes('~')) {
        const parts = data.split('~')
        return {
          code: tidy,
          name: parts[1] || '',
          market: 'HK' as const,
          price: parseFloat(parts[3]) || 0,
          change: parseFloat(parts[31]) || 0,
          changePercent: parseFloat(parts[32]) || 0,
          high: parseFloat(parts[33]) || 0,
          low: parseFloat(parts[34]) || 0,
          open: parseFloat(parts[5]) || 0,
          volume: parseInt(parts[36]) || 0,
          amount: parseFloat(parts[37]) || 0
        }
      }
    }

    return null
  } catch (error) {
    console.error('获取港股行情失败:', error)
    return null
  }
}

/**
 * 获取港股 K 线数据
 * @param stockCode 股票代码
 * @param period K 线周期: day, week, month
 */
export async function getHKStockKLine(stockCode: string, period: string = 'day') {
  try {
    const symbol = hkSymbolForYahoo(stockCode)
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
      params: {
        range: period === 'day' ? '3mo' : period === 'week' ? '6mo' : '2y',
        interval: period === 'day' ? '1d' : period === 'week' ? '1wk' : '1mo'
      },
      timeout: 10000
    })

    if (response.data.chart?.result?.[0]) {
      const result = response.data.chart.result[0]
      const timestamps = result.timestamp || []
      const quotes = result.indicators.quote?.[0] || {}

      return timestamps.map((ts: number, i: number) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        open: quotes.open?.[i] || 0,
        close: quotes.close?.[i] || 0,
        high: quotes.high?.[i] || 0,
        low: quotes.low?.[i] || 0,
        volume: quotes.volume?.[i] || 0
      }))
    }

    return []
  } catch (error) {
    console.error('获取港股K线失败:', error)
    return []
  }
}

/**
 * 搜索港股
 * @param keyword 搜索关键词
 */
export async function searchHKStock(keyword: string) {
  try {
    const hits = await eastmoneySearchSuggest(keyword, 35)
    return hits
      .filter((h) => h.market === 'HK')
      .slice(0, 10)
      .map((item) => ({
        code: item.code,
        name: item.name,
        market: 'HK' as const
      }))
  } catch (error) {
    console.error('搜索港股失败:', error)
    return []
  }
}

export default {
  getHKStockQuote,
  getHKStockKLine,
  searchHKStock
}