import axios from 'axios'
import { buildAnalysisPrompt, parseAnalysisResult, AnalysisRequest } from './prompt'
import { getStockQuote, getStockKLine, getStockBasicInfo, searchStock } from '../services'
import { calculateTechnicalIndicators } from '../factors/technical'
import { getMacroData } from '../factors/macro'
import { getIndustryFactors } from '../factors/industry'
import { getFinancialFactors } from '../factors/financial'
import { getFundData } from '../factors/fund'
import { getCycleData } from '../factors/cycle'
import { getEventData } from '../factors/event'
import { DEFAULT_WEIGHTS, FACTOR_DETAILS, type FactorWeights } from '../factors'

export interface AnalysisResult {
  trend: string
  phase: string
  trendReason: string
  prediction: {
    date: string | null
    confidence: number
    reason: string
  }
  suggestion: {
    type: 'buy' | 'sell' | 'hold'
    price: string | null
    date: string | null
    reason: string
  }
  riskFactors: string[]
  scores?: {
    macro: number
    industry: number
    technical: number
    financial: number
    fund: number
    cycle: number
    event: number
    total: number
  }
  signals?: {
    macro: string
    industry: string
    technical: string
    financial: string
    fund: string
    cycle: string
    event: string
  }
}

/**
 * 调用 MiniMax AI API
 */
async function callMinimaxAI(prompt: string): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY || ''
  
  if (!apiKey) {
    console.warn('未设置 MINIMAX_API_KEY，使用模拟响应')
    return generateMockResponse()
  }

  try {
    const response = await axios.post(
      'https://api.minimax.chat/v1/text/chatcompletion_pro',
      {
        model: 'MiniMax-2.7-联网',
        messages: [
          { role: 'system', content: '你是一个专业的股票拐点分析师，基于数据分析给出客观的投资建议。核心原则：买入的是预期，卖出的是事实。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    return response.data.choices?.[0]?.message?.content || ''
  } catch (error) {
    console.error('MiniMax API 调用失败:', error)
    return generateMockResponse()
  }
}

/**
 * 生成模拟响应
 */
function generateMockResponse(): string {
  const phases = ['预期阶段', '事实阶段']
  const trends = ['上涨趋势', '下跌趋势', '震荡']
  const suggestions = ['buy', 'hold', 'sell']
  
  const phase = phases[Math.floor(Math.random() * phases.length)]
  const trend = trends[Math.floor(Math.random() * trends.length)]
  const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
  
  return JSON.stringify({
    trend,
    phase,
    trendReason: '均线空头排列，MACD 死叉后收敛，量能萎缩至地量',
    prediction: {
      date: '2026-04-20',
      confidence: 65 + Math.floor(Math.random() * 20),
      reason: '技术面超卖 + 宏观预期改善 + 资金面支持'
    },
    suggestion: {
      type: suggestion,
      price: suggestion === 'buy' ? '175.00' : null,
      date: '2026-04-15',
      reason: suggestion === 'buy' 
        ? '当前处于预期阶段，年报已跌完，逢低布局等待拐点' 
        : suggestion === 'sell' 
        ? '利好兑现，考虑减仓' 
        : '持有观望，等待方向明确'
    },
    riskFactors: ['消费复苏不及预期', '行业政策变化', '流动性风险'],
    scores: {
      macro: 60 + Math.floor(Math.random() * 20),
      industry: 55 + Math.floor(Math.random() * 20),
      technical: 45 + Math.floor(Math.random() * 30),
      financial: 55 + Math.floor(Math.random() * 25),
      fund: 60 + Math.floor(Math.random() * 20),
      cycle: 50 + Math.floor(Math.random() * 20),
      event: 50 + Math.floor(Math.random() * 15),
      total: 55 + Math.floor(Math.random() * 25)
    },
    signals: {
      macro: '偏多',
      industry: '中性',
      technical: '偏空',
      financial: '中性',
      fund: '偏多',
      cycle: '中性',
      event: '等待'
    }
  })
}

/**
 * 分析单只股票（完整多因子版本）
 */
export async function analyzeStock(
  code: string,
  market: 'A' | 'HK' | 'US',
  weights?: Partial<FactorWeights>
): Promise<AnalysisResult | null> {
  try {
    console.log(`开始分析股票: ${code} (${market})`)

    // 1. 获取股票行情
    const quote = await getStockQuote(code, market)
    if (!quote) {
      console.warn('获取行情失败，使用模拟数据')
    }

    // 2. 获取 K 线数据
    const klineData = await getStockKLine(code, market, 'day')

    // 3. 计算技术指标
    const technicalIndicators = calculateTechnicalIndicators(klineData)

    // 4. 获取所有因子数据（并行）
    const [macroData, industryData, financialData, fundData, cycleData, eventData] = await Promise.all([
      getMacroData().catch(() => null),
      getIndustryFactors(code, market).catch(() => null),
      getFinancialFactors(code, market).catch(() => null),
      getFundData().catch(() => null),
      getCycleData().catch(() => null),
      getEventData(code, market).catch(() => null)
    ])

    // 5. 构建分析请求
    const request: AnalysisRequest = {
      stock: {
        code,
        name: quote?.name || code,
        market,
        price: quote?.price || 0,
        change: quote?.change || 0,
        changePercent: quote?.changePercent || 0
      },
      technical: {
        trend: String(technicalIndicators.trend),
        maStatus: String(technicalIndicators.maStatus),
        macd: String(technicalIndicators.macd?.value || ''),
        kdj: String(technicalIndicators.kdj?.signal || ''),
        volume: String(`${technicalIndicators.volume?.status || ''}, ${technicalIndicators.volume?.direction || ''}`)
      },
      macro: {
        fedPolicy: String(macroData?.monetary?.[0]?.value || '5.25%'),
        geopolitical: String(macroData?.geopolitical?.[0]?.value || '暂无'),
        sentiment: String(macroData?.sentiment?.[0]?.value || '中性')
      },
      industry: {
        industryTrend: String(industryData?.industryTrend || '行业平稳'),
        upstreamPrices: String(industryData?.upstreamPrices || '上游价格稳定'),
        industryPolicy: String(industryData?.industryPolicy || '无特殊政策')
      },
      financial: {
        earnings: String(financialData?.earnings || '暂无业绩预告'),
        reportDate: String(financialData?.reportDate || '年报季'),
        financials: String(financialData?.financials || '财务指标平稳'),
        valuation: String(financialData?.valuation || '估值适中')
      }
    }

    // 6. 构建扩展 Prompt（包含多因子）
    const extendedPrompt = buildExtendedPrompt(code, market, {
      quote,
      klineData,
      technicalIndicators,
      macroData,
      industryData,
      financialData,
      fundData,
      cycleData,
      eventData,
      weights: weights || DEFAULT_WEIGHTS
    })

    console.log('发送分析请求到 MiniMax...')

    // 7. 调用 AI
    const response = await callMinimaxAI(extendedPrompt)
    console.log('收到 AI 响应')

    // 8. 解析结果
    const result = parseAnalysisResult(response)

    if (result) {
      console.log('分析成功:', result.trend, result.phase)
      return result
    }

    // 解析失败，返回默认结果
    return {
      trend: technicalIndicators.trend,
      phase: '待分析',
      trendReason: '综合多因子分析',
      prediction: {
        date: null,
        confidence: technicalIndicators.score,
        reason: '基于技术面和宏观因子综合判断'
      },
      suggestion: {
        type: technicalIndicators.score > 60 ? 'buy' : technicalIndicators.score < 40 ? 'sell' : 'hold',
        price: null,
        date: null,
        reason: technicalIndicators.score > 60 ? '技术面偏多' : technicalIndicators.score < 40 ? '技术面偏空' : '观望'
      },
      riskFactors: ['数据获取异常']
    }
  } catch (error) {
    console.error('分析股票失败:', error)
    return null
  }
}

/**
 * 构建扩展 Prompt（多因子）
 */
function buildExtendedPrompt(code: string, market: string, data: any): string {
  const marketNames = { A: 'A股', HK: '港股', US: '美股' }
  const { quote, technicalIndicators, macroData, fundData, cycleData, weights } = data

  // 计算综合评分
  const scores = {
    macro: macroData?.monetary?.filter((m: any) => m.signal === 'bullish').length || 0,
    fund: fundData?.northbound?.filter((f: any) => f.signal === 'bullish').length || 0,
    technical: technicalIndicators.score || 50,
    cycle: cycleData?.clock?.[0]?.stage === '复苏' ? 70 : cycleData?.clock?.[0]?.stage === '过热' ? 60 : 50,
    total: 0
  }
  scores.total = (scores.macro * 0.2 + scores.fund * 0.15 + scores.technical * 0.35 + scores.cycle * 0.15 + 15) // 基础分15

  let prompt = `你是一个专业的股票拐点分析师，擅长结合技术面、宏观面、行业面、基本面、资金面、周期等多个因子进行综合分析。

【核心原则】
- 买入的是预期（未来可能好转）
- 卖出的是事实（利好/利空已确认）

【股票信息】
- 代码：${code}
- 市场：${marketNames[market as keyof typeof marketNames]}
- 当前价格：${quote?.price || '数据获取中'}
- 涨跌幅：${quote?.changePercent?.toFixed(2) || '0'}%

【技术面分析】
- 趋势：${technicalIndicators?.trend || '分析中'}
- 均线状态：${technicalIndicators?.maStatus || '分析中'}
- MACD：${technicalIndicators?.macd?.signal || '分析中'}
- KDJ：${technicalIndicators?.kdj?.signal || '分析中'}
- RSI：${technicalIndicators?.rsi?.signal || '分析中'}
- 形态：${technicalIndicators?.pattern || '分析中'}
- 综合评分：${technicalIndicators?.score || 50}/100

【宏观因子】${weights?.macro || 20}%
- 美联储利率：${macroData?.monetary?.[0]?.value || '数据获取中'}
- VIX恐慌指数：${macroData?.sentiment?.[0]?.value || '数据获取中'}
- 地缘政治：${macroData?.geopolitical?.[0]?.name || '暂无'}: ${macroData?.geopolitical?.[0]?.value || '无重大事件'}

【资金面因子】${weights?.fund || 15}%
- 北向资金：${fundData?.northbound?.[0]?.value || '数据获取中'}
- 融资余额：${fundData?.margin?.[0]?.value || '数据获取中'}
- VIX：${fundData?.sentiment?.[0]?.value || '数据获取中'}

【周期因子】${weights?.cycle || 10}%
- 美林时钟：${cycleData?.clock?.[0]?.value || '数据获取中'}
- 季节效应：${cycleData?.seasonal?.[0]?.value || '数据获取中'}

【综合评分】
- 宏观信号：${scores.macro > 2 ? '偏多' : scores.macro < 1 ? '偏空' : '中性'}
- 技术评分：${technicalIndicators?.score || 50}/100
- 综合得分：${Math.round(scores.total)}/100

请按以下JSON格式输出分析结果：
{
  "trend": "当前趋势（上涨/下跌/震荡）",
  "phase": "当前阶段（预期/事实）",
  "trendReason": "趋势判断理由（包含各因子分析）",
  "prediction": {
    "date": "预测拐点日期（YYYY-MM-DD）",
    "confidence": 置信度（0-100）,
    "reason": "预测理由"
  },
  "suggestion": {
    "type": "buy/sell/hold",
    "price": "建议价格（null表示不指定）",
    "date": "建议日期（null表示不指定）",
    "reason": "建议理由"
  },
  "riskFactors": ["风险1", "风险2", "风险3"],
  "scores": {
    "macro": 宏观评分（0-100）,
    "technical": 技术评分（0-100）,
    "fund": 资金评分（0-100）,
    "cycle": 周期评分（0-100）,
    "total": 综合评分（0-100）
  },
  "signals": {
    "macro": "宏观信号（偏多/中性/偏空）",
    "technical": "技术信号",
    "fund": "资金信号",
    "cycle": "周期信号"
  }
}`

  return prompt
}

/**
 * 批量分析股票
 */
export async function analyzeStocks(
  stocks: Array<{ code: string; market: 'A' | 'HK' | 'US' }>,
  weights?: Partial<FactorWeights>
): Promise<Map<string, AnalysisResult>> {
  const results = new Map<string, AnalysisResult>()

  for (const stock of stocks) {
    const result = await analyzeStock(stock.code, stock.market, weights)
    if (result) {
      results.set(stock.code, result)
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return results
}

/**
 * 获取股票完整分析数据
 */
export async function getFullAnalysisData(code: string, market: 'A' | 'HK' | 'US') {
  const [quote, klineData, macroData, industryData, financialData, fundData, cycleData, eventData] = await Promise.all([
    getStockQuote(code, market).catch(() => null),
    getStockKLine(code, market, 'day').catch(() => []),
    getMacroData().catch(() => null),
    getIndustryFactors(code, market).catch(() => null),
    getFinancialFactors(code, market).catch(() => null),
    getFundData().catch(() => null),
    getCycleData().catch(() => null),
    getEventData(code, market).catch(() => null)
  ])

  const technicalIndicators = calculateTechnicalIndicators(klineData)

  return {
    quote,
    klineData,
    technicalIndicators,
    macroData,
    industryData,
    financialData,
    fundData,
    cycleData,
    eventData
  }
}

export default {
  analyzeStock,
  analyzeStocks,
  getFullAnalysisData
}