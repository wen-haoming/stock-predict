// AI 分析 Prompt 模板

interface StockInfo {
  code: string
  name: string
  market: 'A' | 'HK' | 'US'
  price: number
  change: number
  changePercent: number
}

interface TechnicalData {
  trend: string
  maStatus: string
  macd: string
  kdj: string
  volume: string
}

interface MacroFactor {
  fedPolicy: string
  geopolitical: string
  sentiment: string
}

interface IndustryFactor {
  industryTrend: string
  upstreamPrices: string
  industryPolicy: string
}

interface FinancialData {
  earnings: string
  reportDate: string
  financials: string
  valuation: string
}

export interface AnalysisRequest {
  stock: StockInfo
  technical: TechnicalData
  macro: MacroFactor
  industry: IndustryFactor
  financial: FinancialData
}

// 核心原则
const CORE_PRINCIPLE = `
【核心原则】
- 买入的是预期（未来可能好转）
- 卖出的是事实（利好/利空已确认）

【判断逻辑】
1. 如果当前处于"预期"阶段（如业绩预增但未兑现）：
   - 股价可能还在下跌，这是买入机会
   - 等待拐点信号
   
2. 如果当前处于"事实"阶段（如年报已发布且超预期）：
   - 利好已兑现，考虑卖出
   - 或持有但不再追高
`

// 技术面分析模板
const TECHNICAL_TEMPLATE = `
【技术面】
- 当前趋势：{trend}
- 均线状态：{maStatus}
- MACD：{macd}
- KDJ：{kdj}
- 成交量：{volume}
`

// 宏观因子模板
const MACRO_TEMPLATE = `
【宏观因子】
- 美联储政策：{fedPolicy}
- 地缘政治：{geopolitical}
- 市场情绪：{sentiment}
`

// 行业因子模板
const INDUSTRY_TEMPLATE = `
【行业因子】
- 行业趋势：{industryTrend}
- 上游价格：{upstreamPrices}
- 行业政策：{industryPolicy}
`

// 基本面模板
const FINANCIAL_TEMPLATE = `
【基本面】
- 业绩预告：{earnings}
- 财报日期：{reportDate}
- 财务指标：{financials}
- 估值分位：{valuation}
`

// 输出格式要求
const OUTPUT_FORMAT = `
请按以下格式输出分析结果（JSON格式）：

{
  "trend": "当前趋势判断（上涨/下跌/震荡）",
  "phase": "当前阶段（预期/事实）",
  "trendReason": "趋势判断理由",
  "prediction": {
    "date": "预测拐点日期（YYYY-MM-DD，可预测时填写，否则null）",
    "confidence": 置信度（0-100）,
    "reason": "预测理由"
  },
  "suggestion": {
    "type": "buy/sell/hold",
    "price": "建议价格（null表示不指定）",
    "date": "建议日期（null表示不指定）",
    "reason": "建议理由"
  },
  "riskFactors": ["风险1", "风险2"]
}
`

/**
 * 构建完整的分析 Prompt
 */
export function buildAnalysisPrompt(request: AnalysisRequest): string {
  const marketNames = { A: 'A股', HK: '港股', US: '美股' }
  
  return `你是一个专业的股票拐点分析师，擅长结合技术面、宏观面、行业面和基本面进行综合分析。

【股票信息】
- 代码：${request.stock.code}
- 名称：${request.stock.name}
- 市场：${marketNames[request.stock.market]}
- 当前价格：${request.stock.price}
- 涨跌：${request.stock.change > 0 ? '+' : ''}${request.stock.change}（${request.stock.changePercent > 0 ? '+' : ''}${request.stock.changePercent}%）

${CORE_PRINCIPLE}

${TECHNICAL_TEMPLATE.replace('{trend}', request.technical.trend)
  .replace('{maStatus}', request.technical.maStatus)
  .replace('{macd}', request.technical.macd)
  .replace('{kdj}', request.technical.kdj)
  .replace('{volume}', request.technical.volume)}

${MACRO_TEMPLATE.replace('{fedPolicy}', request.macro.fedPolicy)
  .replace('{geopolitical}', request.macro.geopolitical)
  .replace('{sentiment}', request.macro.sentiment)}

${INDUSTRY_TEMPLATE.replace('{industryTrend}', request.industry.industryTrend)
  .replace('{upstreamPrices}', request.industry.upstreamPrices)
  .replace('{industryPolicy}', request.industry.industryPolicy)}

${FINANCIAL_TEMPLATE.replace('{earnings}', request.financial.earnings)
  .replace('{reportDate}', request.financial.reportDate)
  .replace('{financials}', request.financial.financials)
  .replace('{valuation}', request.financial.valuation)}

${OUTPUT_FORMAT}

请基于以上信息，结合"买入预期，卖出事实"的原则，给出专业的分析。
如果某些信息不明确，请根据已有信息进行合理推断，并在reason中说明。
`
}

/**
 * 解析 AI 返回的分析结果
 */
export function parseAnalysisResult(content: string): any {
  try {
    let text = content.trim()
    const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)```/m)
    if (fenced) text = fenced[1].trim()

    // 尝试提取 JSON 部分
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return null
  } catch (error) {
    console.error('解析分析结果失败:', error)
    return null
  }
}

export default {
  buildAnalysisPrompt,
  parseAnalysisResult
}