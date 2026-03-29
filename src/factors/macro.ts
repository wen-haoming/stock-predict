// 宏观因子：仅保留可请求到的公开接口数据，失败返回空，不使用占位假数

export interface MacroFactor {
  name: string
  value: string | number
  change?: string
  signal?: 'bullish' | 'bearish' | 'neutral'
  source?: string
  updatedAt?: string
}

export interface MacroData {
  monetary: MacroFactor[]
  exchange: MacroFactor[]
  inflation: MacroFactor[]
  geopolitical: MacroFactor[]
  sentiment: MacroFactor[]
}

const EMPTY: MacroData = {
  monetary: [],
  exchange: [],
  inflation: [],
  geopolitical: [],
  sentiment: []
}

/**
 * 获取宏观经济数据
 */
export async function getMacroData(): Promise<MacroData> {
  try {
    const [monetary, exchange, inflation, geopolitical, sentiment] = await Promise.all([
      getMonetaryPolicy(),
      getExchangeRates(),
      getInflationData(),
      getGeopoliticalEvents(),
      getMarketSentiment()
    ])

    return { monetary, exchange, inflation, geopolitical, sentiment }
  } catch (error) {
    console.error('获取宏观数据失败:', error)
    return { ...EMPTY }
  }
}

/** FRED Fed + 东财 LPR（能取到则返回，否则该项不出现） */
async function getMonetaryPolicy(): Promise<MacroFactor[]> {
  const out: MacroFactor[] = []
  try {
    const fedResponse = await fetch(
      'https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&limit=1&sort_order=desc',
      { headers: { Accept: 'application/json' } }
    )
    const fedData = await fedResponse.json()
    const obs = fedData.observations?.[0]
    const fedRate = obs?.value
    if (fedRate != null && fedRate !== '.' && `${fedRate}`.trim() !== '') {
      const fr = parseFloat(fedRate)
      out.push({
        name: 'Fed联邦基金利率',
        value: `${fedRate}%`,
        signal: !Number.isNaN(fr) && fr > 4.5 ? 'neutral' : 'bullish',
        source: 'FRED',
        updatedAt: obs?.date
      })
    }
  } catch (e) {
    console.error('FRED 利率失败:', e)
  }

  try {
    const lprResponse = await fetch('https://api.eastmoney.com/data/rate?type=10', {
      headers: { Accept: 'application/json' }
    })
    const lprText = await lprResponse.text()
    const lprMatch = lprText.match(/"1YLz\"\:([0-9.]+)/)
    if (lprMatch) {
      out.push({
        name: '中国1年期LPR',
        value: `${lprMatch[1]}%`,
        signal: 'neutral',
        source: 'Eastmoney'
      })
    }
  } catch (e) {
    console.error('LPR 失败:', e)
  }

  return out
}

/** Yahoo：美元指数 + USD/CNH（CNH=X） */
async function getExchangeRates(): Promise<MacroFactor[]> {
  try {
    const out: MacroFactor[] = []

    const dxyResponse = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/DXY?range=1d&interval=1d')
    const dxyData = await dxyResponse.json()
    const dxyPrice = dxyData.chart?.result?.[0]?.meta?.regularMarketPrice
    if (typeof dxyPrice === 'number' && !Number.isNaN(dxyPrice)) {
      out.push({
        name: '美元指数(DXY)',
        value: dxyPrice.toFixed(2),
        signal: dxyPrice > 105 ? 'bearish' : dxyPrice < 100 ? 'bullish' : 'neutral',
        source: 'Yahoo'
      })
    }

    const cnyResponse = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/CNY=X?range=1d&interval=1d')
    const cnyData = await cnyResponse.json()
    const usdcny = cnyData.chart?.result?.[0]?.meta?.regularMarketPrice
    if (typeof usdcny === 'number' && !Number.isNaN(usdcny)) {
      out.push({
        name: '美元兑人民币(离岸参考)',
        value: usdcny.toFixed(4),
        signal: usdcny > 7.3 ? 'bearish' : usdcny < 7.0 ? 'bullish' : 'neutral',
        source: 'Yahoo'
      })
    }

    return out
  } catch (error) {
    console.error('获取汇率数据失败:', error)
    return []
  }
}

/** 未对接统计局/东财通胀序列时返回空（原硬编码 CPI/PMI 已移除） */
async function getInflationData(): Promise<MacroFactor[]> {
  return []
}

/** 未接新闻 API 时不返回虚构地缘条目 */
async function getGeopoliticalEvents(): Promise<MacroFactor[]> {
  return []
}

/** 仅 VIX（Yahoo） */
async function getMarketSentiment(): Promise<MacroFactor[]> {
  try {
    const vixResponse = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?range=1d&interval=1d'
    )
    const vixData = await vixResponse.json()
    const vix = vixData.chart?.result?.[0]?.meta?.regularMarketPrice
    if (typeof vix === 'number' && !Number.isNaN(vix)) {
      return [
        {
          name: 'VIX恐慌指数',
          value: vix.toFixed(2),
          signal: vix > 30 ? 'bearish' : vix < 15 ? 'bullish' : 'neutral',
          source: 'CBOE/Yahoo'
        }
      ]
    }
  } catch (error) {
    console.error('VIX 失败:', error)
  }
  return []
}

export default {
  getMacroData,
  getMonetaryPolicy,
  getExchangeRates,
  getInflationData,
  getGeopoliticalEvents,
  getMarketSentiment
}
