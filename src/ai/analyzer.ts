import axios, { isAxiosError } from 'axios'
import { buildAnalysisPrompt, parseAnalysisResult, AnalysisRequest } from './prompt'
import { loadProjectEnv } from '../env/loadProjectEnv'

loadProjectEnv(import.meta.url)
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

function hasOpenAICompatibleKey(): boolean {
  return !!(process.env.ANALYSIS_API_KEY || process.env.OPENAI_API_KEY)?.trim()
}

/** 只记录状态与响应体片段，避免打印 axios 完整对象（会带出 Authorization） */
function logAiHttpError(provider: string, err: unknown): void {
  if (isAxiosError(err)) {
    const status = err.response?.status
    const data = err.response?.data
    let body = ''
    try {
      body = typeof data === 'string' ? data : data !== undefined ? JSON.stringify(data) : ''
    } catch {
      body = String(data)
    }
    if (body.length > 1200) body = body.slice(0, 1200) + '…'
    console.error(`${provider} HTTP ${status ?? '(无状态)'}${body ? `: ${body}` : ''}`)
    if (status === 401) {
      console.error(
        `${provider} 401：服务端拒绝了当前密钥。请核对：① Token Plan 专用 Key 是否在订阅有效期内，且未与「按量付费」Key 混用；② MINIMAX_API_BASE 是否与申请密钥的站点一致（中文站 Token Plan 常用 https://api.minimaxi.com/v1 ，对应文档里的 Anthropic 基址为 https://api.minimaxi.com/anthropic）；③ 若密钥曾泄露，请到控制台换新。说明：https://platform.minimaxi.com/docs/faq/about-apis`
      )
    }
    return
  }
  console.error(`${provider} 调用异常:`, err instanceof Error ? err.message : err)
}

/**
 * OpenAI 兼容接口（/v1/chat/completions），密钥见 ANALYSIS_API_KEY 或 OPENAI_API_KEY
 */
async function callOpenAICompatible(prompt: string): Promise<string | null> {
  const apiKey = (process.env.ANALYSIS_API_KEY || process.env.OPENAI_API_KEY || '').trim()
  if (!apiKey) return null

  const base = (process.env.ANALYSIS_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.ANALYSIS_MODEL || 'gpt-4o-mini'

  try {
    const response = await axios.post(
      `${base}/chat/completions`,
      {
        model,
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的股票拐点分析师，基于数据分析给出客观的投资建议。核心原则：买入的是预期，卖出的是事实。请严格按用户要求的 JSON 格式输出，不要输出 Markdown 代码围栏。'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    )
    const text = response.data?.choices?.[0]?.message?.content
    return typeof text === 'string' ? text : null
  } catch (error) {
    logAiHttpError('OpenAI 兼容 API', error)
    return null
  }
}

/**
 * MiniMax OpenAI 兼容 Chat（文档：https://platform.minimaxi.com/docs/api-reference/text-openai-api ）
 * 环境变量：MINIMAX_API_KEY、可选 MINIMAX_API_BASE（默认 https://api.minimaxi.com/v1 ，与 Token Plan 文档中 Anthropic 基址 api.minimaxi.com 同域）、MINIMAX_MODEL（默认 MiniMax-M2.7）
 */
function resolveMinimaxApiKey(): string {
  const direct = (process.env.MINIMAX_API_KEY || process.env.AI_API_KEY || '').trim()
  if (direct) return direct
  const base = (process.env.ANALYSIS_API_BASE || '').toLowerCase()
  if (base.includes('minimax') && process.env.ANALYSIS_API_KEY) {
    return process.env.ANALYSIS_API_KEY.trim()
  }
  return ''
}

async function callMinimaxChatCompletions(prompt: string): Promise<string | null> {
  const apiKey = resolveMinimaxApiKey()
  if (!apiKey) return null

  const base = (process.env.MINIMAX_API_BASE || 'https://api.minimaxi.com/v1').replace(/\/$/, '')
  const model = process.env.MINIMAX_MODEL || 'MiniMax-M2.7'

  try {
    const response = await axios.post(
      `${base}/chat/completions`,
      {
        model,
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的股票拐点分析师，基于数据分析给出客观的投资建议。核心原则：买入的是预期，卖出的是事实。请严格按用户要求的 JSON 格式输出，不要使用 Markdown 代码围栏。'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(process.env.MINIMAX_GROUP_ID?.trim()
            ? { 'Group-Id': process.env.MINIMAX_GROUP_ID.trim() }
            : {})
        },
        timeout: 120000
      }
    )

    let text = response.data?.choices?.[0]?.message?.content
    if (typeof text !== 'string') return null
    // M2.x 可能在正文中夹带思考标签，解析前去掉
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
    return text || null
  } catch (err) {
    logAiHttpError('MiniMax', err)
    return null
  }
}

/**
 * 优先 MiniMax（国内账号常用），其次 ANALYSIS_API_KEY + 自定义 BASE（可为 OpenAI 或其他兼容端）
 * 不再在失败时静默返回随机 JSON，避免前端误以为真分析结果
 */
async function callAnalysisAI(prompt: string): Promise<string> {
  const minimaxKey = resolveMinimaxApiKey()
  if (minimaxKey) {
    const t = await callMinimaxChatCompletions(prompt)
    if (t) return t
  }

  const fromOpenAI = await callOpenAICompatible(prompt)
  if (fromOpenAI) return fromOpenAI

  if (!minimaxKey && !hasOpenAICompatibleKey()) {
    console.warn(
      '未配置可用 AI：请在项目根 .env 设置 MINIMAX_API_KEY / AI_API_KEY，或 ANALYSIS_API_KEY + ANALYSIS_API_BASE'
    )
  } else {
    console.warn(
      'AI 未返回可用正文：请查看上方 MiniMax / OpenAI 的 HTTP 日志（401 多为密钥无效、类型与套餐不匹配或泄露后被停用；1008 为余额不足）'
    )
  }
  return ''
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
      console.warn('获取行情失败，将继续用 K 线与因子做有限分析')
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

    console.log('发送分析请求到 AI（MiniMax / OpenAI 兼容）...')

    // 7. 调用 AI
    const response = await callAnalysisAI(extendedPrompt)
    console.log('收到 AI 响应', response ? `长度 ${response.length}` : '（空）')

    // 8. 解析结果
    const result = response ? parseAnalysisResult(response) : null

    if (result) {
      console.log('分析成功:', result.trend, result.phase)
      return result
    }

    const noKey = !resolveMinimaxApiKey() && !hasOpenAICompatibleKey()
    const fallbackReason = noKey
      ? '未配置 AI：请在项目根目录 .env 中设置 MINIMAX_API_KEY（Token Plan 见 https://platform.minimaxi.com/subscribe/token-plan）。以下为基于本地行情与技术面的简要结论，非大模型分析。'
      : response
        ? 'AI 已返回但 JSON 解析失败，请查看服务端日志。以下为基于技术面的简要结论。'
        : 'AI 无有效返回或调用失败，请检查密钥、余额与 MINIMAX_API_BASE。以下为基于技术面的简要结论。'

    return {
      trend: technicalIndicators.trend,
      phase: '待分析',
      trendReason: fallbackReason,
      prediction: {
        date: null,
        confidence: technicalIndicators.score,
        reason: '基于技术面和已抓取的因子数据的技术性总结（非 LLM 正文）'
      },
      suggestion: {
        type: technicalIndicators.score > 60 ? 'buy' : technicalIndicators.score < 40 ? 'sell' : 'hold',
        price: null,
        date: null,
        reason: technicalIndicators.score > 60 ? '技术面偏多' : technicalIndicators.score < 40 ? '技术面偏空' : '观望'
      },
      riskFactors: ['AI 分析不可用或解析失败', '请优先完成 MiniMax 配置后重试']
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