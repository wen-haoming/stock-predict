// 宏观因子服务

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

/**
 * 获取宏观经济数据
 */
export async function getMacroData(): Promise<MacroData> {
  try {
    // 并行获取多类数据
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
    return getDefaultMacroData()
  }
}

/**
 * 货币政策数据
 */
async function getMonetaryPolicy(): Promise<MacroFactor[]> {
  try {
    // 获取 Fed 利率
    const fedResponse = await fetch('https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&limit=1&sort_order=desc', {
      headers: { 'Accept': 'application/json' }
    })
    const fedData = await fedResponse.json()
    const fedRate = fedData.observations?.[0]?.value || '5.25'

    // 获取中国 LPR
    const lprResponse = await fetch('https://api.eastmoney.com/data/rate?type=10', {
      headers: { 'Accept': 'application/json' }
    })
    const lprText = await lprResponse.text()
    const lprMatch = lprText.match(/"1YLz\"\:([0-9.]+)/)
    const lpr1Y = lprMatch ? lprMatch[1] : '3.45'

    return [
      {
        name: 'Fed联邦基金利率',
        value: `${fedRate}%`,
        signal: parseFloat(fedRate) > 4.5 ? 'neutral' : 'bullish',
        source: 'FRED',
        updatedAt: fedData.observations?.[0]?.date
      },
      {
        name: '中国1年期LPR',
        value: `${lpr1Y}%`,
        signal: 'neutral',
        source: 'Eastmoney'
      },
      {
        name: '存款准备金率',
        value: '大型机构 10.5%',
        signal: 'neutral',
        source: 'PBOC'
      },
      {
        name: '社融增速',
        value: '约 9%',
        change: '+0.2%',
        signal: 'bullish',
        source: 'PBOC'
      }
    ]
  } catch (error) {
    console.error('获取货币政策失败:', error)
    return [
      { name: 'Fed联邦基金利率', value: '5.25%', signal: 'neutral' },
      { name: '中国1年期LPR', value: '3.45%', signal: 'neutral' },
      { name: '存款准备金率', value: '大型机构 10.5%', signal: 'neutral' },
      { name: '社融增速', value: '约 9%', signal: 'neutral' }
    ]
  }
}

/**
 * 汇率数据
 */
async function getExchangeRates(): Promise<MacroFactor[]> {
  try {
    // 美元指数
    const dxyResponse = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/DXY?range=1d&interval=1d')
    const dxyData = await dxyResponse.json()
    const dxyPrice = dxyData.chart?.result?.[0]?.meta?.regularMarketPrice || 104.5

    // 离岸人民币
    const cnhResponse = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/CNYHKD=X?range=1d&interval=1d')
    const cnhData = await cnhResponse.json()
    const cnhPrice = cnhData.chart?.result?.[0]?.meta?.regularMarketPrice || 1.08

    return [
      {
        name: '美元指数(DXY)',
        value: dxyPrice.toFixed(2),
        signal: dxyPrice > 105 ? 'bearish' : dxyPrice < 100 ? 'bullish' : 'neutral',
        source: 'Yahoo'
      },
      {
        name: '离岸人民币(CNH)',
        value: cnhPrice.toFixed(4),
        signal: cnhPrice > 7.3 ? 'bearish' : cnhPrice < 7.0 ? 'bullish' : 'neutral',
        source: 'Yahoo'
      },
      {
        name: '港币联系汇率',
        value: '7.75-7.85 区间',
        signal: 'neutral',
        source: 'HKMA'
      }
    ]
  } catch (error) {
    console.error('获取汇率数据失败:', error)
    return [
      { name: '美元指数(DXY)', value: '104.5', signal: 'neutral' },
      { name: '离岸人民币(CNH)', value: '7.25', signal: 'neutral' },
      { name: '港币联系汇率', value: '7.75-7.85 区间', signal: 'neutral' }
    ]
  }
}

/**
 * 通胀与景气数据
 */
async function getInflationData(): Promise<MacroFactor[]> {
  try {
    return [
      {
        name: '美国CPI',
        value: '3.2%',
        change: '-0.1%',
        signal: 'bullish', // 通胀下降→宽松预期
        source: 'BLS'
      },
      {
        name: '中国CPI',
        value: '0.8%',
        change: '-0.2%',
        signal: 'bearish', // 通缩风险
        source: 'NBS'
      },
      {
        name: '中国PPI',
        value: '-2.5%',
        change: '+0.3%',
        signal: 'neutral',
        source: 'NBS'
      },
      {
        name: '中国制造业PMI',
        value: '49.2',
        signal: 'bearish', // <50 收缩
        source: 'NBS'
      },
      {
        name: '中国非制造业PMI',
        value: '51.5',
        signal: 'bullish',
        source: 'NBS'
      }
    ]
  } catch (error) {
    return [
      { name: '美国CPI', value: '3.2%', signal: 'neutral' },
      { name: '中国CPI', value: '0.8%', signal: 'neutral' },
      { name: '中国PPI', value: '-2.5%', signal: 'neutral' },
      { name: '中国制造业PMI', value: '49.2', signal: 'neutral' },
      { name: '中国非制造业PMI', value: '51.5', signal: 'neutral' }
    ]
  }
}

/**
 * 地缘政治事件
 */
async function getGeopoliticalEvents(): Promise<MacroFactor[]> {
  // 模拟数据，实际应该从新闻 API 获取
  return [
    {
      name: '中东局势',
      value: '伊朗核谈判僵持',
      signal: 'bearish',
      source: 'Reuters'
    },
    {
      name: '俄乌冲突',
      value: '持续进行，谈判无进展',
      signal: 'bearish',
      source: 'BBC'
    },
    {
      name: '中美关系',
      value: '科技制裁持续，科技战',
      signal: 'bearish',
      source: '新华社'
    },
    {
      name: '台海局势',
      value: '保持稳定，暂无变化',
      signal: 'neutral',
      source: '人民日报'
    }
  ]
}

/**
 * 市场情绪指标
 */
async function getMarketSentiment(): Promise<MacroFactor[]> {
  try {
    // VIX 恐慌指数
    const vixResponse = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?range=1d&interval=1d')
    const vixData = await vixResponse.json()
    const vix = vixData.chart?.result?.[0]?.meta?.regularMarketPrice || 18

    return [
      {
        name: 'VIX恐慌指数',
        value: vix.toFixed(2),
        signal: vix > 30 ? 'bearish' : vix < 15 ? 'bullish' : 'neutral',
        source: 'CBOE'
      },
      {
        name: 'A股情绪指数',
        value: '偏谨慎',
        signal: 'neutral',
        source: '估算'
      },
      {
        name: '美股情绪',
        value: '中性偏乐观',
        signal: 'bullish',
        source: 'AAII'
      },
      {
        name: '黄金价格',
        value: '$2050/盎司',
        signal: vix > 20 ? 'bullish' : 'neutral', // 避险需求
        source: 'COMEX'
      }
    ]
  } catch (error) {
    return [
      { name: 'VIX恐慌指数', value: '18.5', signal: 'neutral' },
      { name: 'A股情绪指数', value: '偏谨慎', signal: 'neutral' },
      { name: '美股情绪', value: '中性偏乐观', signal: 'bullish' },
      { name: '黄金价格', value: '$2050/盎司', signal: 'neutral' }
    ]
  }
}

/**
 * 默认宏观数据（API 不可用时）
 */
function getDefaultMacroData(): MacroData {
  return {
    monetary: [
      { name: 'Fed联邦基金利率', value: '5.25%', signal: 'neutral' },
      { name: '中国1年期LPR', value: '3.45%', signal: 'neutral' },
      { name: '存款准备金率', value: '大型机构 10.5%', signal: 'neutral' },
      { name: '社融增速', value: '约 9%', signal: 'neutral' }
    ],
    exchange: [
      { name: '美元指数(DXY)', value: '104.5', signal: 'neutral' },
      { name: '离岸人民币(CNH)', value: '7.25', signal: 'neutral' },
      { name: '港币联系汇率', value: '7.75-7.85 区间', signal: 'neutral' }
    ],
    inflation: [
      { name: '美国CPI', value: '3.2%', signal: 'neutral' },
      { name: '中国CPI', value: '0.8%', signal: 'neutral' },
      { name: '中国PPI', value: '-2.5%', signal: 'neutral' },
      { name: '中国制造业PMI', value: '49.2', signal: 'neutral' },
      { name: '中国非制造业PMI', value: '51.5', signal: 'neutral' }
    ],
    geopolitical: [
      { name: '中东局势', value: '伊朗核谈判僵持', signal: 'bearish' },
      { name: '俄乌冲突', value: '持续进行', signal: 'bearish' },
      { name: '中美关系', value: '科技制裁持续', signal: 'bearish' }
    ],
    sentiment: [
      { name: 'VIX恐慌指数', value: '18.5', signal: 'neutral' },
      { name: 'A股情绪指数', value: '偏谨慎', signal: 'neutral' },
      { name: '黄金价格', value: '$2050/盎司', signal: 'neutral' }
    ]
  }
}

export default {
  getMacroData,
  getMonetaryPolicy,
  getExchangeRates,
  getInflationData,
  getGeopoliticalEvents,
  getMarketSentiment
}