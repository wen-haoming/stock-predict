// 因子库统一导出

export * from './technical'   // 技术面因子
export * from './macro'        // 宏观因子
export * from './industry'     // 行业因子
export * from './financial'    // 基本面因子
export * from './fund'         // 资金面因子 (新增)
export * from './cycle'        // 周期因子 (新增)
export * from './event'        // 事件驱动因子 (新增)

// 因子权重配置
export interface FactorWeights {
  macro: number       // 宏观因子权重
  industry: number     // 行业因子权重
  technical: number   // 技术因子权重
  financial: number   // 基本面因子权重
  fund: number        // 资金面因子权重 (新增)
  cycle: number       // 周期因子权重 (新增)
  event: number       // 事件因子权重 (新增)
}

// 默认因子权重（总和 = 100%）
export const DEFAULT_WEIGHTS: FactorWeights = {
  macro: 20,
  industry: 15,
  technical: 20,
  financial: 15,
  fund: 15,      // 北向/融资/主力
  cycle: 10,     // 美林时钟/季节性
  event: 5       // 财报/分红/政策
}

// 因子详细权重配置（供 UI 展示）
export const FACTOR_DETAILS = {
  macro: {
    label: '宏观因子',
    icon: '🌐',
    color: '#58a6ff',
    factors: [
      { key: 'fed_policy', name: '美联储利率', weight: 30, description: '联邦基金利率' },
      { key: 'lpr', name: 'LPR利率', weight: 20, description: '贷款市场报价利率' },
      { key: 'exchange', name: '汇率', weight: 25, description: '美元/人民币' },
      { key: 'cpi', name: 'CPI/PPI', weight: 15, description: '通胀数据' },
      { key: 'pmi', name: 'PMI', weight: 20, description: '采购经理指数' },
      { key: 'geopolitical', name: '地缘政治', weight: 25, description: '战争/制裁' },
      { key: 'vix', name: 'VIX恐慌指数', weight: 15, description: '市场情绪' }
    ]
  },
  industry: {
    label: '行业因子',
    icon: '🏭',
    color: '#a371f7',
    factors: [
      { key: 'industry_trend', name: '行业趋势', weight: 30, description: '行业指数走势' },
      { key: 'industry_pe', name: '行业PE分位', weight: 20, description: '估值历史分位' },
      { key: 'upstream_prices', name: '上游价格', weight: 25, description: '大宗商品价格' },
      { key: 'industry_policy', name: '行业政策', weight: 25, description: '补贴/限制政策' },
      { key: 'competition', name: '竞争格局', weight: 15, description: 'CR3/CR5' },
      { key: 'capacity', name: '产能周期', weight: 15, description: '供需关系' }
    ]
  },
  technical: {
    label: '技术因子',
    icon: '📊',
    color: '#3fb950',
    factors: [
      { key: 'ma_trend', name: '均线趋势', weight: 25, description: 'MA5/20/60排列' },
      { key: 'ema_trend', name: 'EMA趋势', weight: 15, description: 'EMA12/26' },
      { key: 'macd', name: 'MACD', weight: 25, description: '金叉/死叉' },
      { key: 'kdj', name: 'KDJ', weight: 20, description: '超买超卖' },
      { key: 'rsi', name: 'RSI', weight: 15, description: '相对强弱' },
      { key: 'cci', name: 'CCI', weight: 10, description: '商品通道' },
      { key: 'volume', name: '成交量', weight: 20, description: '量比/换手' },
      { key: 'boll', name: '布林带', weight: 15, description: '轨道突破' },
      { key: 'pattern', name: '形态识别', weight: 10, description: '头肩顶/双底' }
    ]
  },
  financial: {
    label: '基本面因子',
    icon: '📈',
    color: '#f0883e',
    factors: [
      { key: 'revenue_growth', name: '营收增速', weight: 25, description: '收入增长' },
      { key: 'profit_growth', name: '净利润增速', weight: 25, description: '利润增长' },
      { key: 'roe', name: 'ROE', weight: 20, description: '净资产收益率' },
      { key: 'gross_margin', name: '毛利率', weight: 15, description: '盈利能力' },
      { key: 'pe', name: 'PE估值', weight: 20, description: '市盈率分位' },
      { key: 'pb', name: 'PB估值', weight: 15, description: '市净率' },
      { key: 'cash_flow', name: '经营现金流', weight: 20, description: '造血能力' },
      { key: 'debt_ratio', name: '资产负债率', weight: 15, description: '杠杆水平' }
    ]
  },
  fund: {
    label: '资金面因子',
    icon: '💰',
    color: '#f778ba',
    factors: [
      { key: 'northbound', name: '北向资金', weight: 30, description: '外资流向' },
      { key: 'super_large', name: '超大单', weight: 25, description: '主力流入' },
      { key: 'margin', name: '融资余额', weight: 25, description: '杠杆资金' },
      { key: 'short_interest', name: '融券余额', weight: 20, description: '做空力量' },
      { key: 'turnover', name: '换手率', weight: 15, description: '活跃度' },
      { key: 'limit_up', name: '涨停家数', weight: 15, description: '市场情绪' }
    ]
  },
  cycle: {
    label: '周期因子',
    icon: '🔄',
    color: '#79c0ff',
    factors: [
      { key: 'clock_stage', name: '美林时钟', weight: 40, description: '衰退/复苏/过热/滞胀' },
      { key: 'seasonal', name: '季节性', weight: 30, description: '1月开门红/5月魔咒' },
      { key: 'industry_cycle', name: '行业周期', weight: 30, description: '导入/成长/成熟/衰退' }
    ]
  },
  event: {
    label: '事件驱动',
    icon: '📅',
    color: '#7ee787',
    factors: [
      { key: 'annual_report', name: '年报披露', weight: 30, description: '4月底' },
      { key: 'quarterly_report', name: '季报披露', weight: 25, description: '季报季' },
      { key: 'dividend', name: '分红除权', weight: 20, description: '除权调整' },
      { key: 'policy', name: '政策事件', weight: 25, description: '两会/经济会议' }
    ]
  }
}

// 因子评分计算
export interface FactorScore {
  macro: number
  industry: number
  technical: number
  financial: number
  fund: number
  cycle: number
  event: number
  total: number
}

// 综合评分说明
export const SCORE_LEVELS = {
  80: { label: '强烈买入', color: '#3fb950', description: '多个因子共振，看多信号强烈' },
  60: { label: '谨慎买入', color: '#7ee787', description: '部分因子支持，可考虑布局' },
  40: { label: '中性观望', color: '#f0883e', description: '多空因素均衡，等待信号明确' },
  20: { label: '谨慎卖出', color: '#f85149', description: '空头因子占优，注意风险' },
  0: { label: '强烈卖出', color: '#da3633', description: '多个因子共振，看空信号强烈' }
}

export default {
  DEFAULT_WEIGHTS,
  FACTOR_DETAILS,
  SCORE_LEVELS
}