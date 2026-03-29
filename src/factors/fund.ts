// 资金面因子（仅返回可拉取的真实数据；失败时为空数组，不用占位假数）

export interface FundFactor {
  name: string
  value: string | number
  change?: string
  direction?: 'inflow' | 'outflow' | 'neutral'
  signal?: 'bullish' | 'bearish' | 'neutral'
  source?: string
}

export interface FundData {
  northbound: FundFactor[]
  mainForce: FundFactor[]
  margin: FundFactor[]
  sentiment: FundFactor[]
}

const EMPTY: FundData = {
  northbound: [],
  mainForce: [],
  margin: [],
  sentiment: []
}

/**
 * 获取资金面数据
 */
export async function getFundData(): Promise<FundData> {
  try {
    const [northbound, mainForce, margin, sentiment] = await Promise.all([
      getNorthboundData(),
      getMainForceData(),
      getMarginData(),
      getSentimentData()
    ])

    return { northbound, mainForce, margin, sentiment }
  } catch (error) {
    console.error('获取资金数据失败:', error)
    return { ...EMPTY }
  }
}

/**
 * 北向资金（东财公开接口）
 */
async function getNorthboundData(): Promise<FundFactor[]> {
  try {
    const response = await fetch(
      'https://push2.eastmoney.com/api/qt/stock/fflow/daykline/get?lmt=0&klt=101&fields1=f1,f2,f3,f7&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63',
      {
        headers: { Referer: 'https://data.eastmoney.com' }
      }
    )
    const data = await response.json()

    if (data?.data?.klines?.length) {
      const lastDay = data.data.klines[data.data.klines.length - 1].split(',')
      const netInflow = parseFloat(lastDay[1]) || 0

      return [
        {
          name: '北向今日净买入',
          value: `${netInflow > 0 ? '+' : ''}${netInflow.toFixed(2)}亿`,
          direction: netInflow > 0 ? ('inflow' as const) : ('outflow' as const),
          signal: netInflow > 0 ? ('bullish' as const) : ('bearish' as const),
          source: 'Eastmoney'
        },
        {
          name: '北向流向',
          value: netInflow > 0 ? '净流入' : '净流出',
          direction: netInflow > 0 ? ('inflow' as const) : ('outflow' as const),
          signal: netInflow > 0 ? ('bullish' as const) : ('bearish' as const),
          source: 'Eastmoney'
        }
      ]
    }
  } catch (error) {
    console.error('北向资金接口失败:', error)
  }
  return []
}

/** 主力资金：暂无统一免费稳定 API，返回空 */
async function getMainForceData(): Promise<FundFactor[]> {
  return []
}

/** 融资融券：暂无接入，返回空 */
async function getMarginData(): Promise<FundFactor[]> {
  return []
}

/** 市场情绪：由宏观模块 VIX 等覆盖；此处不填假数 */
async function getSentimentData(): Promise<FundFactor[]> {
  return []
}

export default {
  getFundData,
  getNorthboundData,
  getMainForceData,
  getMarginData,
  getSentimentData
}
