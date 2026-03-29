// 行业因子获取

export interface IndustryFactors {
  industryTrend: string
  upstreamPrices: string
  industryPolicy: string
}

// 行业分类
const industryMapping: Record<string, { trend: string; policy: string }> = {
  '白酒': { trend: '行业调整期，需求偏弱', policy: '消费税政策影响' },
  '新能源': { trend: '行业高增长，渗透率提升', policy: '补贴政策延续' },
  '半导体': { trend: '国产替代加速', policy: '芯片扶持政策' },
  '房地产': { trend: '行业下行周期', policy: '限购松绑政策' },
  '银行': { trend: '净息差收窄', policy: '降息压力' },
  '医药': { trend: '估值回归，研发创新', policy: '医保谈判' },
  '消费': { trend: '复苏缓慢', policy: '刺激消费政策' }
}

// 上游商品价格（简化版）
const commodityPrices = {
  '原油': { price: 85, trend: '上涨', reason: '地缘风险' },
  '铜': { price: 9200, trend: '震荡', reason: '需求疲软' },
  '铝': { price: 2200, trend: '下跌', reason: '供给增加' },
  '铁矿石': { price: 120, trend: '下跌', reason: '钢厂限产' }
}

/**
 * 获取行业因子
 */
export async function getIndustryFactors(stockCode: string, market: 'A' | 'HK' | 'US'): Promise<IndustryFactors> {
  // 实际应该根据股票代码查询所属行业，这里用简化逻辑
  let industry = '消费'
  
  // A 股行业判断
  if (market === 'A') {
    if (stockCode.startsWith('6')) {
      // 上证
      if (stockCode.startsWith('600') && parseInt(stockCode.slice(-3)) < 100) {
        industry = '银行'
      }
    }
  }

  const industryInfo = industryMapping[industry] || { trend: '行业平稳', policy: '无特殊政策' }

  // 上游价格影响
  let upstreamImpact = '上游价格稳定'
  if (industry === '新能源') {
    upstreamImpact = `锂价: ${commodityPrices['铜'].trend}，成本压力 ${commodityPrices['铜'].trend === '下跌' ? '减轻' : '存在'}`
  } else if (industry === '半导体') {
    upstreamImpact = '硅晶圆价格稳定，设备进口受限'
  } else if (industry === '消费') {
    upstreamImpact = '原材料价格回落，成本改善'
  }

  return {
    industryTrend: `${industry}: ${industryInfo.trend}`,
    upstreamPrices: upstreamImpact,
    industryPolicy: industryInfo.policy
  }
}

/**
 * 获取行业趋势
 */
export async function getIndustryTrend(industry: string): Promise<{ trend: 'up' | 'down' | 'neutral'; confidence: number }> {
  const info = industryMapping[industry]
  if (!info) {
    return { trend: 'neutral', confidence: 50 }
  }

  const trend = info.trend.includes('下行') || info.trend.includes('偏弱') ? 'down' :
                info.trend.includes('高增长') || info.trend.includes('加速') ? 'up' : 'neutral'

  return { trend, confidence: 70 }
}

/**
 * 获取大宗商品价格
 */
export async function getCommodityPrices(): Promise<Record<string, { price: number; trend: string }>> {
  return commodityPrices
}

export default {
  getIndustryFactors,
  getIndustryTrend,
  getCommodityPrices
}