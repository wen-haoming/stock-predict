// 基本面因子获取

export interface FinancialFactors {
  earnings: string
  reportDate: string
  financials: string
  valuation: string
}

/**
 * 获取基本面因子
 */
export async function getFinancialFactors(stockCode: string, market: 'A' | 'HK' | 'US'): Promise<FinancialFactors> {
  // 实际应该从 API 获取，这里用简化逻辑
  return {
    earnings: '近期无业绩预告，需关注年报发布时间',
    reportDate: '年报季（3-4月），建议关注业绩披露时间',
    financials: '营收增速平稳，净利润率处于行业平均水平',
    valuation: '当前估值处于历史中位，有一定安全边际'
  }
}

/**
 * 获取财报日历
 */
export async function getReportCalendar(stockCode: string, market: 'A' | 'HK' | 'US'): Promise<Array<{ date: string; type: string; status: string }>> {
  // 简化版，实际应该从东财 API 获取
  const month = new Date().getMonth() + 1
  
  const reports = []
  if (month >= 1 && month <= 4) {
    reports.push({ date: '2026-04-30', type: '一季报', status: '待发布' })
  }
  reports.push({ date: '2026-04-30', type: '年报', status: '待发布' })
  if (month >= 6 && month <= 8) {
    reports.push({ date: '2026-08-31', type: '中报', status: '待发布' })
  }
  if (month >= 10 && month <= 11) {
    reports.push({ date: '2026-10-31', type: '三季报', status: '待发布' })
  }

  return reports
}

/**
 * 计算估值指标
 */
export function calculateValuation(price: number, eps: number, bvps: number): {
  pe: number
  pb: number
  percentile: string
} {
  const pe = eps > 0 ? price / eps : 0
  const pb = bvps > 0 ? price / bvps : 0

  // 简化估值分位
  let percentile = '偏低'
  if (pe > 50) percentile = '偏高'
  else if (pe > 30) percentile = '中性偏高'
  else if (pe > 15) percentile = '适中'
  else if (pe > 0) percentile = '偏低'

  return { pe, pb, percentile }
}

export default {
  getFinancialFactors,
  getReportCalendar,
  calculateValuation
}