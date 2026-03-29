import axios from 'axios'

// 东财公开 API 接口
const EASTMONEY_BASE = 'https://push2.eastmoney.com'
const EASTMONEY_HIST = 'https://push2his.eastmoney.com'
const SINA_BASE = 'https://hq.sinajs.cn'

/**
 * 获取 A 股实时行情 (使用新浪接口，更稳定)
 * @param stockCode 股票代码，如 600519
 */
export async function getAStockQuote(stockCode: string) {
  try {
    // 新浪股票接口 - 免费且稳定
    const market = stockCode.startsWith('6') ? 'sh' : 'sz'
    const response = await axios.get(`${SINA_BASE}/list/${market}${stockCode}`, {
      headers: {
        'Referer': 'https://finance.sina.com.cn',
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 10000
    })

    const dataStr = response.data
    // 格式: var hq_str_sh600519="贵州茅台,1800.00,1790.00,1795.00,1798.00,1785.00,1790.00,1795.00,..."
    const match = dataStr.match(/"([^"]+)"/)
    
    if (match) {
      const fields = match[1].split(',')
      return {
        code: stockCode,
        name: fields[0] || '',
        market: 'A' as const,
        price: parseFloat(fields[3]) || 0,
        change: parseFloat(fields[3]) - parseFloat(fields[2]) || 0,
        changePercent: ((parseFloat(fields[3]) - parseFloat(fields[2])) / parseFloat(fields[2]) * 100) || 0,
        high: parseFloat(fields[4]) || 0,
        low: parseFloat(fields[5]) || 0,
        open: parseFloat(fields[1]) || 0,
        volume: parseInt(fields[8]) || 0,
        amount: parseFloat(fields[9]) || 0
      }
    }
    
    return null
  } catch (error) {
    console.error('获取A股行情失败:', error)
    return null
  }
}

/**
 * 获取 A 股 K 线数据 (使用东财历史接口)
 * @param stockCode 股票代码
 * @param period K 线周期: day, week, month
 * @param count 数据条数
 */
export async function getAStockKLine(stockCode: string, period: string = 'day', count: number = 100) {
  try {
    const secid = stockCode.startsWith('6') ? `1.${stockCode}` : `0.${stockCode}`
    const klt = period === 'day' ? 101 : period === 'week' ? 102 : 103
    
    const response = await axios.get(`${EASTMONEY_HIST}/api/qt/stock/kline/get`, {
      params: {
        secid,
        fields1: 'f1,f2,f3,f4,f5,f6',
        fields2: 'f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61',
        klt,
        fqt: 0,
        lmt: count,
        end: 20500101
      },
      headers: {
        'Referer': 'https://finance.eastmoney.com',
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 15000
    })

    if (response.data?.data?.klines) {
      return response.data.data.klines.map((line: string) => {
        const [date, open, close, high, low, volume, amount] = line.split(',')
        return {
          date,
          open: parseFloat(open),
          close: parseFloat(close),
          high: parseFloat(high),
          low: parseFloat(low),
          volume: parseInt(volume),
          amount: parseFloat(amount)
        }
      })
    }

    return []
  } catch (error) {
    console.error('获取K线数据失败:', error)
    return []
  }
}

/**
 * 获取股票基本面数据
 * @param stockCode 股票代码
 */
export async function getAStockBasicInfo(stockCode: string) {
  try {
    const response = await axios.get('https://datacenter.eastmoney.com/securities/api/data/v1/get', {
      params: {
        reportName: 'RPT_F10_ORG_BASICINFO',
        columns: 'SECURITY_CODE,SECURITY_NAME_ABBR,ORG_NAME,INDUSTRY,MAIN_BUSINESS',
        filter: `(SECURITY_CODE="${stockCode}")`,
        pageNumber: 1,
        pageSize: 1
      },
      timeout: 10000
    })

    if (response.data?.result?.data?.length > 0) {
      return response.data.result.data[0]
    }

    return null
  } catch (error) {
    console.error('获取基本面数据失败:', error)
    return null
  }
}

/**
 * 搜索股票
 * @param keyword 搜索关键词
 */
export async function searchAStock(keyword: string) {
  try {
    // 东财股票搜索
    const response = await axios.get('https://searchapi.eastmoney.com/api/suggest/get', {
      params: {
        input: keyword,
        type: '14',
        token: 'D43BF722C8E33BDC906FB84D85E326E8',
        markettype: '',
        mktnum: '',
        jys: '',
        classb: '',
        object: '',
        status: '',
        page: 1,
        count: 10
      },
      timeout: 10000
    })

    if (response.data?.Quodata) {
      return response.data.Quodata.map((item: any) => ({
        code: item.SecurityCode,
        name: item.SecurityName,
        market: 'A' as const,
        type: item.TradeMarket === '上交所' ? 'SH' : 'SZ'
      }))
    }

    return []
  } catch (error) {
    console.error('搜索股票失败:', error)
    return []
  }
}

export default {
  getAStockQuote,
  getAStockKLine,
  getAStockBasicInfo,
  searchAStock
}