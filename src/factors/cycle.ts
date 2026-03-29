// 周期因子

export interface CycleFactor {
  name: string
  value: string | number
  stage?: string
  signal?: 'bullish' | 'bearish' | 'neutral'
  description?: string
}

export interface CycleData {
  clock: CycleFactor[]      // 美林时钟
  seasonal: CycleFactor[]  // 季节性
  industry: CycleFactor[]  // 行业周期
}

/**
 * 获取周期数据
 */
export async function getCycleData(): Promise<CycleData> {
  const now = new Date()
  const month = now.getMonth() + 1
  const quarter = Math.floor((month - 1) / 3) + 1

  return {
    clock: getMerrillClock(month),
    seasonal: getSeasonalEffect(month),
    industry: getIndustryCycle()
  }
}

/**
 * 美林时钟
 * - 衰退：债券 > 现金 > 股票
 * - 复苏：股票 > 债券 > 商品
 * - 过热：商品 > 股票 > 债券
 * - 滞胀：现金 > 商品 > 股票
 */
function getMerrillClock(month: number): CycleFactor[] {
  // 根据当前经济指标判断周期
  // 这里用简化逻辑，实际应该根据 CPI 和 GDP 增速判断
  
  const indicators = {
    inflation: 2.5, // 假设CPI 2.5%
    growth: 5.0,    // 假设GDP增速 5%
  }

  let stage: string
  let strategy: string
  let industries: string[]

  if (indicators.inflation < 2 && indicators.growth < 3) {
    stage = '衰退'
    strategy = '债券 > 现金 > 股票'
    industries = ['防御性板块', '消费', '医药']
  } else if (indicators.inflation < 3 && indicators.growth > 4) {
    stage = '复苏'
    strategy = '股票 > 债券 > 商品'
    industries = ['周期股', '科技', '消费']
  } else if (indicators.inflation > 4 && indicators.growth > 5) {
    stage = '过热'
    strategy = '商品 > 股票 > 债券'
    industries = ['原材料', '能源', '有色']
  } else {
    stage = '滞胀'
    strategy = '现金 > 商品 > 股票'
    industries = ['现金为王', '能源', '医疗']
  }

  return [
    {
      name: '美林时钟阶段',
      value: stage,
      stage,
      description: `当前处于${stage}期，建议配置：${strategy}`
    },
    {
      name: '推荐资产',
      value: strategy.split(' > ')[0],
      signal: 'neutral',
      description: strategy
    },
    {
      name: '推荐行业',
      value: industries.join(', '),
      signal: 'bullish',
      description: '根据当前周期推荐的行业'
    },
    {
      name: 'CPI同比',
      value: `${indicators.inflation}%`,
      stage,
      signal: indicators.inflation < 2 ? 'bullish' : indicators.inflation > 4 ? 'bearish' : 'neutral'
    },
    {
      name: 'GDP增速',
      value: `${indicators.growth}%`,
      stage,
      signal: indicators.growth > 5 ? 'bullish' : indicators.growth < 3 ? 'bearish' : 'neutral'
    }
  ]
}

/**
 * 季节性效应
 */
function getSeasonalEffect(month: number): CycleFactor[] {
  const monthNames = ['', '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  
  // A股季节性规律
  const seasonalPatterns: Record<number, { effect: string; description: string; signal: 'bullish' | 'bearish' | 'neutral' }> = {
    1: { effect: '开门红', description: '1月资金布局新年行情，历史上上涨概率较大', signal: 'bullish' },
    2: { effect: '春节行情', description: '春节前后消费旺季，部分板块表现活跃', signal: 'bullish' },
    3: { effect: '两会行情', description: '3月两会政策预期，市场活跃', signal: 'neutral' },
    4: { effect: '年报季', description: '4月底年报披露完毕，业绩验证期', signal: 'neutral' },
    5: { effect: 'Sell in May', description: '5月魔咒，历史上下跌概率较高', signal: 'bearish' },
    6: { effect: '年中结算', description: '半年末资金紧张，市场承压', signal: 'bearish' },
    7: { effect: '中报季', description: '7-8月中报预告披露', signal: 'neutral' },
    8: { effect: '中报披露', description: '8月是中报密集披露期', signal: 'neutral' },
    9: { effect: '开学季', description: '教育消费旺季，部分个股机会', signal: 'neutral' },
    10: { effect: '三季报', description: '10月三季报预告，业绩预期调整', signal: 'neutral' },
    11: { effect: '估值切换', description: '年末机构调仓，准备明年行情', signal: 'neutral' },
    12: { effect: '吃饭行情', description: '年末资金做账，部分个股机会', signal: 'bullish' }
  }

  const current = seasonalPatterns[month] || { effect: '正常交易', description: '', signal: 'neutral' as const }

  // 计算距离下一个重要时点的天数
  const nextKeyMonth = month >= 4 ? 4 : (month >= 8 ? 8 : 4)

  return [
    {
      name: '当前月份',
      value: monthNames[month],
      signal: 'neutral'
    },
    {
      name: '季节效应',
      value: current.effect,
      signal: current.signal,
      description: current.description
    },
    {
      name: '年报季压力',
      value: (month >= 3 && month <= 4) ? '高' : (month >= 1 && month <= 2 || month >= 11) ? '低' : '中',
      signal: (month >= 3 && month <= 4) ? 'bearish' : 'neutral'
    },
    {
      name: '季报季压力',
      value: (month === 4 || month === 8 || month === 10) ? '高' : '低',
      signal: 'neutral'
    }
  ]
}

/**
 * 行业周期位置
 */
function getIndustryCycle(): CycleFactor[] {
  return [
    {
      name: '新能源车',
      value: '成长期',
      stage: '高渗透率扩张',
      description: '渗透率 30%+，增速放缓但仍高于 GDP',
      signal: 'neutral'
    },
    {
      name: '光伏',
      value: '成熟期',
      stage: '产能过剩',
      description: '产能周期下行，博弈加剧',
      signal: 'bearish'
    },
    {
      name: '半导体',
      value: '周期底部',
      stage: '国产替代',
      description: '库存周期触底，政策支持',
      signal: 'bullish'
    },
    {
      name: '白酒',
      value: '成熟期',
      stage: '存量竞争',
      description: '高端稳健，次高端承压',
      signal: 'neutral'
    },
    {
      name: '医药',
      value: '成长期',
      stage: '估值修复',
      description: '反腐影响消退，估值修复',
      signal: 'bullish'
    },
    {
      name: '房地产',
      value: '衰退期',
      stage: '出清',
      description: '行业下行，出清尚未完成',
      signal: 'bearish'
    },
    {
      name: '银行',
      value: '成熟期',
      stage: '净息差收窄',
      description: '降息压力，资产质量担忧',
      signal: 'bearish'
    },
    {
      name: '消费电子',
      value: '周期底部',
      stage: '库存去化',
      description: '需求疲软，库存周期触底',
      signal: 'neutral'
    }
  ]
}

export default {
  getCycleData
}