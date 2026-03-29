// 数据结构类型定义 - 股票拐点预测系统

// ============== 1. 股票数据接口 ==============
export interface StockQuote {
  code: string           // 股票代码
  name: string           // 股票名称
  market: 'A' | 'HK' | 'US'  // 市场
  price: number          // 当前价格
  change: number         // 涨跌额
  changePercent: number  // 涨跌幅 %
  high: number          // 最高价
  low: number            // 最低价
  open: number           // 开盘价
  volume: number        // 成交量
  amount: number        // 成交额
}

export interface KLineItem {
  date: string           // 日期 YYYY-MM-DD
  open: number           // 开盘价
  close: number          // 收盘价
  high: number           // 最高价
  low: number            // 最低价
  volume: number         // 成交量
  amount?: number        // 成交额（可选）
}

// ============== 2. AI 分析结果 ==============
export interface AnalysisResult {
  trend: string          // 上涨/下跌/震荡
  phase: string          // 预期/事实
  trendReason: string    // 趋势理由
  prediction: {
    date: string | null  // 预测拐点日期
    confidence: number  // 置信度 0-100
    reason: string       // 预测理由
  }
  suggestion: {
    type: 'buy' | 'sell' | 'hold'
    price: string | null // 建议价格
    date: string | null  // 建议日期
    reason: string       // 建议理由
  }
  riskFactors: string[]  // 风险因素
  scores?: {             // 各因子评分（可选）
    macro: number
    industry: number
    technical: number
    financial: number
    fund: number
    cycle: number
    event: number
    total: number
  }
  signals?: {             // 信号（可选）
    macro: string
    industry: string
    technical: string
    financial: string
    fund: string
    cycle: string
    event: string
  }
}

// ============== 3. 因子数据结构 ==============
export interface FactorItem {
  key: string
  name: string
  weight: number          // 权重 0-100
  description?: string    // 说明
  locked?: boolean       // 是否锁定
  value?: string | number // 当前值
  signal?: 'bullish' | 'bearish' | 'neutral' // 信号
}

export interface FactorCategory {
  label: string
  icon: string
  color: string
  factors: FactorItem[]
}

export interface FactorWeights {
  macro: number
  industry: number
  technical: number
  financial: number
  fund: number
  cycle: number
  event: number
}

// ============== 4. 数据库模型 (IndexedDB) ==============
export interface DBWatchlist {
  code: string
  market: string
  name?: string
  addedAt: string  // ISO 时间
}

export interface DBPrediction {
  id?: number
  code: string
  market: string
  trend: string
  phase: string
  predictionDate?: string
  confidence?: number
  suggestionType: 'buy' | 'sell' | 'hold'
  suggestionPrice?: string
  createdAt: string
}

export interface DBCache {
  code: string
  market: string
  price: number
  change: number
  changePercent: number
  updatedAt: string
}

// ============== 5. 技术指标 ==============
export interface TechnicalIndicators {
  trend: string
  maStatus: string
  emaStatus: string
  trendLine: string
  macd: {
    value: string
    signal: string
    histogram: number
  }
  kdj: {
    k: number
    d: number
    j: number
    signal: string
  }
  rsi: { value: number; signal: string }
  cci: { value: number; signal: string }
  volume: {
    ratio: number
    status: string
    direction: string
  }
  boll: {
    upper: number
    middle: number
    lower: number
    position: number
  }
  atr: number
  pattern: string
  score: number
}

// ============== 6. 宏观因子 ==============
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

// ============== 7. 资金面因子 ==============
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

// ============== 8. 周期因子 ==============
export interface CycleFactor {
  name: string
  value: string | number
  stage?: string
  signal?: 'bullish' | 'bearish' | 'neutral'
  description?: string
}

export interface CycleData {
  clock: CycleFactor[]
  seasonal: CycleFactor[]
  industry: CycleFactor[]
}

// ============== 9. 事件驱动因子 ==============
export interface EventFactor {
  name: string
  type: 'report' | 'dividend' | 'corporate' | 'policy'
  date?: string
  status?: 'pending' | 'confirmed' | 'expired'
  impact?: 'positive' | 'negative' | 'neutral'
  description?: string
}

export interface EventData {
  reports: EventFactor[]
  dividends: EventFactor[]
  corporate: EventFactor[]
  policies: EventFactor[]
}

// ============== 10. 行业因子 ==============
export interface IndustryFactor {
  industryTrend: string
  upstreamPrices: string
  industryPolicy: string
}

// ============== 11. 基本面因子 ==============
export interface FinancialFactor {
  earnings: string
  reportDate: string
  financials: string
  valuation: string
}

// ============== 12. API 响应格式 ==============
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface StockApiResponse {
  quote: StockQuote | null
  kline: KLineItem[]
}

export interface AnalyzeApiRequest {
  code: string
  market: 'A' | 'HK' | 'US'
}

// ============== 13. 时间线数据结构 ==============
export interface TimelineItem {
  id: string
  date: string
  type: 'fact' | 'expectation' | 'pivot' | 'report'
  title: string
  description?: string
  status?: string
  impact?: 'positive' | 'negative' | 'neutral'
}

// ============== 14. 搜索结果 ==============
export interface SearchResult {
  code: string
  name: string
  market: 'A' | 'HK' | 'US'
  exchange?: string
}