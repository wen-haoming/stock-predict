import axios from 'axios'

/**
 * 获取美股实时行情（Yahoo Finance）
 * @param stockCode 股票代码，如 AAPL
 */
export async function getUSStockQuote(stockCode: string) {
  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${stockCode}`, {
      params: {
        range: '1d',
        interval: '1m'
      },
      timeout: 10000
    })

    if (response.data.chart?.result?.[0]) {
      const result = response.data.chart.result[0]
      const meta = result.meta
      const quote = result.indicators.quote?.[0]

      return {
        code: stockCode,
        name: meta.shortName || stockCode,
        market: 'US' as const,
        price: meta.regularMarketPrice || 0,
        change: meta.regularMarketChange || 0,
        changePercent: meta.regularMarketChangePercent || 0,
        high: meta.regularMarketDayHigh || 0,
        low: meta.regularMarketDayLow || 0,
        open: meta.regularMarketOpen || 0,
        volume: meta.regularMarketVolume || 0,
        amount: 0 // 美股不提供成交额
      }
    }

    return null
  } catch (error) {
    console.error('获取美股行情失败:', error)
    return null
  }
}

/**
 * 获取美股 K 线数据
 * @param stockCode 股票代码
 * @param period K 线周期: day, week, month
 */
export async function getUSStockKLine(stockCode: string, period: string = 'day') {
  try {
    const range = period === 'day' ? '3mo' : period === 'week' ? '6mo' : '2y'
    const interval = period === 'day' ? '1d' : period === 'week' ? '1wk' : '1mo'

    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${stockCode}`, {
      params: { range, interval },
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
    console.error('获取美股K线失败:', error)
    return []
  }
}

/**
 * 获取美股基本面数据
 * @param stockCode 股票代码
 */
export async function getUSStockBasicInfo(stockCode: string) {
  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${stockCode}`, {
      params: {
        modules: 'summaryProfile,summaryDetail,defaultKeyStatistics,financialData'
      },
      timeout: 10000
    })

    if (response.data.quoteSummary?.result?.[0]) {
      const data = response.data.quoteSummary.result[0]
      return {
        name: data.summaryProfile?.longName || stockCode,
        industry: data.summaryProfile?.industry || '',
        sector: data.summaryProfile?.sector || '',
        marketCap: data.summaryDetail?.marketCap?.raw || 0,
        pe: data.defaultKeyStatistics?.trailingPE?.raw || 0,
        eps: data.defaultKeyStatistics?.trailingEps?.raw || 0,
        revenue: data.financialData?.totalRevenue?.raw || 0,
        earningsGrowth: data.financialData?.earningsGrowth?.raw || 0
      }
    }

    return null
  } catch (error) {
    console.error('获取美股基本面失败:', error)
    return null
  }
}

/**
 * 搜索美股
 * @param keyword 搜索关键词
 */
export async function searchUSStock(keyword: string) {
  try {
    const response = await axios.get('https://query1.finance.yahoo.com/v1/finance/search', {
      params: {
        q: keyword,
        quotesCount: 10,
        newsCount: 0
      },
      timeout: 10000
    })

    if (response.data.quotes) {
      return response.data.quotes
        .filter((q: any) => q.quoteType === 'EQUITY')
        .slice(0, 10)
        .map((item: any) => ({
          code: item.symbol,
          name: item.shortname || item.longname || item.symbol,
          market: 'US',
          exchange: item.exchange
        }))
    }

    return []
  } catch (error) {
    console.error('搜索美股失败:', error)
    return []
  }
}

export default {
  getUSStockQuote,
  getUSStockKLine,
  getUSStockBasicInfo,
  searchUSStock
}