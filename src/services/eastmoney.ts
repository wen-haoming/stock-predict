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

const EASTMONEY_SUGGEST = 'https://searchapi.eastmoney.com/api/suggest/get'
const EASTMONEY_SUGGEST_TOKEN = 'D43BF722C8E33BDC906FB84D85E326E8'

/** 东财 suggest 当前为 QuotationCodeTable.Data，旧版为 Quodata */
function normalizeSuggestRows(data: any): any[] {
  const table = data?.QuotationCodeTable?.Data
  if (Array.isArray(table) && table.length > 0) return table
  const legacy = data?.Quodata
  if (!Array.isArray(legacy) || legacy.length === 0) return []
  return legacy.map((item: any) => ({
    Code: item.SecurityCode,
    Name: item.SecurityName,
    Classify: item.Classify,
    JYS: item.JYS,
    SecurityTypeName: item.SecurityTypeName,
    SecurityType: item.SecurityType
  }))
}

function suggestRowMarket(row: any): 'A' | 'HK' | 'US' | null {
  const c = row.Classify || ''
  const jys = String(row.JYS || '')
  if (c === 'HK' || jys === 'HK') return 'HK'
  if (c === 'UsStock' || String(row.SecurityTypeName || '').includes('美股')) return 'US'
  if (c === 'AStock') return 'A'
  if (/^\d{6}$/.test(String(row.Code || '').trim())) return 'A'
  return null
}

/** 排除可转债、票据等非普通股 */
function suggestRowIsCommonEquity(row: any): boolean {
  const st = String(row.SecurityType ?? '')
  const name = String(row.Name || row.SecurityName || '')
  if (/Notes|票据|债券|转债|ETF|基金/i.test(name)) return false
  return ['1', '19', '20'].includes(st)
}

export interface EastmoneySearchHit {
  code: string
  name: string
  market: 'A' | 'HK' | 'US'
}

/**
 * 东财统一联想（A / 港股 / 美股），勿再传 markettype=8 等过时参数
 */
export async function eastmoneySearchSuggest(keyword: string, maxCount = 30): Promise<EastmoneySearchHit[]> {
  const response = await axios.get(EASTMONEY_SUGGEST, {
    params: {
      input: keyword.trim(),
      type: '14',
      token: EASTMONEY_SUGGEST_TOKEN,
      page: 1,
      count: maxCount
    },
    timeout: 10000,
    headers: {
      Referer: 'https://www.eastmoney.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  })

  const rows = normalizeSuggestRows(response.data)
  const out: EastmoneySearchHit[] = []
  const seen = new Set<string>()

  for (const row of rows) {
    if (!suggestRowIsCommonEquity(row)) continue
    const market = suggestRowMarket(row)
    if (!market) continue
    const code = String(row.Code || '').trim()
    const name = String(row.Name || '').trim()
    if (!code || !name) continue
    const key = `${market}-${code}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ code, name, market })
  }
  return out
}

/**
 * 搜索股票
 * @param keyword 搜索关键词
 */
export async function searchAStock(keyword: string) {
  try {
    const hits = await eastmoneySearchSuggest(keyword, 35)
    return hits
      .filter((h) => h.market === 'A')
      .slice(0, 10)
      .map((item) => ({
        code: item.code,
        name: item.name,
        market: 'A' as const,
        type: item.code.startsWith('6') ? ('SH' as const) : ('SZ' as const)
      }))
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