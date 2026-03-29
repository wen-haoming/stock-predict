// 事件驱动因子

export interface EventFactor {
  name: string
  type: 'report' | 'dividend' | 'corporate' | 'policy'
  date?: string
  status?: 'pending' | 'confirmed' | 'expired'
  impact?: 'positive' | 'negative' | 'neutral'
  description?: string
}

export interface EventData {
  reports: EventFactor[]    // 财报事件
  dividends: EventFactor[] // 分红事件
  corporate: EventFactor[]  // 公司事件
  policies: EventFactor[]   // 政策事件
}

/**
 * 获取事件数据
 */
export async function getEventData(stockCode: string, market: 'A' | 'HK' | 'US'): Promise<EventData> {
  const [reports, dividends, corporate, policies] = await Promise.all([
    getReportEvents(stockCode),
    getDividendEvents(stockCode),
    getCorporateEvents(stockCode),
    getPolicyEvents()
  ])

  return { reports, dividends, corporate, policies }
}

/**
 * 财报事件
 */
async function getReportEvents(stockCode: string): Promise<EventFactor[]> {
  // 从东方财富获取财报日期
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    // 模拟数据，根据实际股票调整
    const reports = []

    // 年报（次年4月）
    if (month >= 1 && month <= 4) {
      reports.push({
        name: '年报披露',
        type: 'report' as const,
        date: `${year}-04-30`,
        status: 'pending',
        description: `${year - 1}年度年报披露截止日`
      })
    } else {
      reports.push({
        name: '年报披露',
        type: 'report' as const,
        date: `${year - 1}-04-30`,
        status: 'expired',
        description: `${year - 1}年度年报已披露`
      })
    }

    // 一季报（次年4月）
    if (month >= 1 && month <= 4) {
      reports.push({
        name: '一季报披露',
        type: 'report' as const,
        date: `${year}-04-30`,
        status: 'pending',
        description: `${year}年度一季报披露截止日`
      })
    }

    // 中报（次年8月）
    if (month >= 6 && month <= 8) {
      reports.push({
        name: '中报披露',
        type: 'report' as const,
        date: `${year}-08-31`,
        status: 'pending',
        description: `${year}年度中报披露截止日`
      })
    }

    // 三季报（次年10月）
    if (month >= 9 && month <= 10) {
      reports.push({
        name: '三季报披露',
        type: 'report' as const,
        date: `${year}-10-31`,
        status: 'pending',
        description: `${year}年度三季报披露截止日`
      })
    }

    // 业绩预告
    reports.push({
      name: '业绩预告',
      type: 'report' as const,
      date: '不定',
      status: 'pending',
      description: '预计发布业绩预告'
    })

    return reports
  } catch (error) {
    console.error('获取财报事件失败:', error)
    return [
      { name: '年报披露', type: 'report' as const, status: 'pending', description: '年度财务报告' },
      { name: '中报披露', type: 'report' as const, status: 'pending', description: '半年度财务报告' },
      { name: '业绩预告', type: 'report' as const, status: 'pending', description: '业绩预告/修正公告' }
    ]
  }
}

/**
 * 分红事件
 */
async function getDividendEvents(stockCode: string): Promise<EventFactor[]> {
  // 模拟数据
  return [
    {
      name: '分红除权',
      type: 'dividend' as const,
      date: '待定',
      status: 'pending',
      description: '现金分红除权，注意股价调整'
    },
    {
      name: '送转股',
      type: 'dividend' as const,
      date: '待定',
      status: 'pending',
      description: '高送转预期（若有）'
    }
  ]
}

/**
 * 公司重大事件
 */
async function getCorporateEvents(stockCode: string): Promise<EventFactor[]> {
  // 模拟数据
  return [
    {
      name: '股权激励',
      type: 'corporate' as const,
      status: 'pending',
      description: '股权激励计划，可能绑定业绩'
    },
    {
      name: '定增/配股',
      type: 'corporate' as const,
      status: 'pending',
      description: '再融资计划，可能稀释股权'
    },
    {
      name: '大股东增减持',
      type: 'corporate' as const,
      status: 'pending',
      description: '关注大股东动向'
    },
    {
      name: '限售股解禁',
      type: 'corporate' as const,
      status: 'pending',
      description: '关注解禁带来的抛压'
    }
  ]
}

/**
 * 政策事件（行业+宏观）
 */
async function getPolicyEvents(): Promise<EventFactor[]> {
  const now = new Date()
  const month = now.getMonth() + 1

  // 常见政策时间点
  const policies: EventFactor[] = []

  // 两会（3月）
  if (month === 3) {
    policies.push({
      name: '全国两会',
      type: 'policy' as const,
      date: '3月初',
      status: 'pending',
      impact: 'positive',
      description: '关注政策方向信号'
    })
  }

  // 年末中央经济工作会议
  if (month === 12 || month === 1) {
    policies.push({
      name: '中央经济工作会议',
      type: 'policy' as const,
      date: '12月',
      status: month === 12 ? 'pending' : 'expired',
      impact: 'positive',
      description: '次年经济工作定调'
    })
  }

  // 政治局会议（每月）
  policies.push({
    name: '政治局会议',
    type: 'policy' as const,
    date: '每月末',
    status: 'pending',
    impact: 'neutral',
    description: '关注政策微调信号'
  })

  // 年末一号文件（农业）
  if (month === 1 || month === 2) {
    policies.push({
      name: '中央一号文件',
      type: 'policy' as const,
      date: '1-2月',
      status: month === 1 || month === 2 ? 'pending' : 'expired',
      impact: 'positive',
      description: '农业政策支持方向'
    })
  }

  // 美联储利率决议（每6-8周）
  policies.push({
    name: '美联储FOMC会议',
    type: 'policy' as const,
    date: '约每6周',
    status: 'pending',
    impact: 'negative',
    description: '利率决议，影响全球流动性'
  })

  // 默认政策
  return policies.length > 0 ? policies : [
    { name: '政策支持', type: 'policy' as const, status: 'pending', impact: 'positive', description: '行业政策支持' },
    { name: '监管政策', type: 'policy' as const, status: 'pending', impact: 'neutral', description: '行业监管动态' }
  ]
}

/**
 * 获取即将到来的重要日期
 */
export async function getUpcomingEvents(stockCode: string, market: 'A' | 'HK' | 'US'): Promise<EventFactor[]> {
  const allEvents = await getEventData(stockCode, market)
  
  // 合并所有事件并按日期排序
  const all: EventFactor[] = [
    ...allEvents.reports,
    ...allEvents.dividends,
    ...allEvents.corporate,
    ...allEvents.policies
  ]

  // 只返回未来30天内的
  const now = new Date()
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  return all.filter(event => {
    if (!event.date || event.date === '不定') return false
    const eventDate = new Date(event.date)
    return eventDate >= now && eventDate <= thirtyDaysLater
  })
}

export default {
  getEventData,
  getUpcomingEvents
}