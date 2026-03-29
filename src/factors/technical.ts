// 技术面因子计算

export interface TechnicalIndicators {
  // 趋势类
  trend: string
  maStatus: string
  emaStatus: string
  trendLine: string
  
  // 动量类
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
  rsi: {
    value: number
    signal: string
  }
  cci: {
    value: number
    signal: string
  }
  
  // 成交量类
  volume: {
    ratio: number
    status: string
    direction: string
  }
  
  // 波动类
  boll: {
    upper: number
    middle: number
    lower: number
    position: number // %B
  }
  atr: number
  
  // 形态类
  pattern: string
  
  // 综合评分
  score: number
}

export interface KLineItem {
  date: string
  open: number
  close: number
  high: number
  low: number
  volume: number
  amount?: number
}

/**
 * 计算所有技术指标
 */
export function calculateTechnicalIndicators(klineData: KLineItem[]): TechnicalIndicators {
  if (klineData.length < 30) {
    return getDefaultIndicators()
  }

  const closes = klineData.map(k => k.close)
  const highs = klineData.map(k => k.high)
  const lows = klineData.map(k => k.low)
  const volumes = klineData.map(k => k.volume)

  return {
    trend: calculateTrend(klineData),
    maStatus: calculateMAStatus(closes),
    emaStatus: calculateEMAStatus(closes),
    trendLine: calculateTrendLine(klineData),
    macd: calculateMACD(closes),
    kdj: calculateKDJ(klineData),
    rsi: calculateRSI(closes),
    cci: calculateCCI(klineData),
    volume: calculateVolume(volumes),
    boll: calculateBOLL(klineData),
    atr: calculateATR(klineData),
    pattern: detectPattern(klineData),
    score: calculateScore(klineData)
  }
}

/**
 * 计算趋势
 */
function calculateTrend(data: KLineItem[]): string {
  const recent = data.slice(-20)
  const ma20 = calculateMA(recent.map(d => d.close), 20)
  const ma60 = data.length >= 60 ? calculateMA(data.map(d => d.close), 60) : []
  
  const currentPrice = recent[recent.length - 1].close
  const ma20Value = ma20[ma20.length - 1]
  const ma60Value = ma60.length > 0 ? ma60[ma60.length - 1] : ma20Value
  
  // 上涨趋势：价格 > MA20 > MA60
  if (currentPrice > ma20Value && ma20Value > ma60Value) {
    return '上涨趋势'
  }
  // 下跌趋势：价格 < MA20 < MA60
  if (currentPrice < ma20Value && ma20Value < ma60Value) {
    return '下跌趋势'
  }
  // 震荡：价格在均线之间
  return '震荡'
}

/**
 * 计算均线状态
 */
function calculateMAStatus(closes: number[]): string {
  const ma5 = calculateMA(closes, 5)
  const ma10 = calculateMA(closes, 10)
  const ma20 = calculateMA(closes, 20)
  const ma60 = closes.length >= 60 ? calculateMA(closes, 60) : []
  
  const last = closes.length - 1
  const m5 = ma5[last]
  const m10 = ma10[last]
  const m20 = ma20[last]
  const m60 = ma60.length > 0 ? ma60[ma60.length - 1] : m20
  
  // 多头排列
  if (m5 > m10 && m10 > m20 && m20 > m60) {
    return '均线多头排列（强势）'
  }
  // 空头排列
  if (m5 < m10 && m10 < m20 && m20 < m60) {
    return '均线空头排列（弱势）'
  }
  // 混乱
  return '均线混乱（震荡）'
}

/**
 * 计算 EMA 状态
 */
function calculateEMAStatus(closes: number[]): string {
  const ema12 = calculateEMA(closes, 12)
  const ema26 = calculateEMA(closes, 26)
  
  const last = closes.length - 1
  const e12 = ema12[last]
  const e26 = ema26[last]
  
  if (e12 > e26) {
    return 'EMA12 > EMA26（偏多）'
  }
  return 'EMA12 < EMA26（偏空）'
}

/**
 * 计算趋势线
 */
function calculateTrendLine(data: KLineItem[]): string {
  const recent = data.slice(-30)
  const first = recent[0]
  const last = recent[recent.length - 1]
  
  const angle = Math.atan2(last.close - first.close, recent.length - 1) * (180 / Math.PI)
  
  if (angle > 15) {
    return '上升趋势线（强势）'
  }
  if (angle < -15) {
    return '下降趋势线（弱势）'
  }
  return '水平趋势（震荡）'
}

/**
 * 计算 MACD
 */
function calculateMACD(closes: number[]): TechnicalIndicators['macd'] {
  const ema12 = calculateEMA(closes, 12)
  const ema26 = calculateEMA(closes, 26)
  
  const dif = ema12.map((v, i) => v - ema26[i])
  const dea = calculateEMA(dif, 9)
  const macd = dif.map((v, i) => (v - dea[i]) * 2)
  
  const last = closes.length - 1
  const difVal = dif[last]
  const deaVal = dea[last]
  const macdVal = macd[last]
  const histPrev = macd[last - 1]
  
  let signal = '中性'
  if (difVal > 0 && deaVal > 0 && macdVal > 0) {
    signal = '金叉（看多）'
  } else if (difVal < 0 && deaVal < 0 && macdVal < 0) {
    signal = '死叉（看空）'
  } else if (macdVal > 0 && histPrev < 0) {
    signal = 'MACD 绿柱放大'
  } else if (macdVal < 0 && histPrev > 0) {
    signal = 'MACD 红柱缩小'
  }
  
  return {
    value: `DIF: ${difVal.toFixed(3)}, DEA: ${deaVal.toFixed(3)}, MACD: ${macdVal.toFixed(3)}`,
    signal,
    histogram: macdVal
  }
}

/**
 * 计算 KDJ
 */
function calculateKDJ(data: KLineItem[]): TechnicalIndicators['kdj'] {
  const period = 9
  const highs = data.map(d => d.high)
  const lows = data.map(d => d.low)
  const closes = data.map(d => d.close)
  
  const rsv: number[] = []
  const k: number[] = []
  const d: number[] = []
  
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      rsv.push(50)
      k.push(50)
      d.push(50)
      continue
    }
    
    const high = Math.max(...highs.slice(i - period + 1, i + 1))
    const low = Math.min(...lows.slice(i - period + 1, i + 1))
    const close = closes[i]
    
    const rsvVal = high === low ? 50 : (close - low) / (high - low) * 100
    rsv.push(rsvVal)
    
    const prevK = k[k.length - 1]
    const prevD = d[d.length - 1]
    
    k.push((2 * prevK + rsvVal) / 3)
    d.push((2 * prevD + k[k.length - 1]) / 3)
  }
  
  const last = closes.length - 1
  const kVal = k[last]
  const dVal = d[last]
  const jVal = 3 * kVal - 2 * dVal
  
  let signal = '中性'
  if (kVal > dVal && kVal < 80) {
    signal = '金叉（超卖反弹）'
  } else if (kVal < dVal && kVal > 20) {
    signal = '死叉（超买回调）'
  } else if (kVal < 20) {
    signal = '超卖区域（可能反弹）'
  } else if (kVal > 80) {
    signal = '超买区域（注意风险）'
  }
  
  return { k: kVal, d: dVal, j: jVal, signal }
}

/**
 * 计算 RSI
 */
function calculateRSI(closes: number[], period: number = 14): TechnicalIndicators['rsi'] {
  if (closes.length < period + 1) {
    return { value: 50, signal: '数据不足' }
  }
  
  let gains = 0
  let losses = 0
  
  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1]
    if (change > 0) {
      gains += change
    } else {
      losses -= change
    }
  }
  
  const avgGain = gains / period
  const avgLoss = losses / period
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
  const rsi = 100 - (100 / (1 + rs))
  
  let signal = '中性'
  if (rsi < 30) {
    signal = '超卖（可能反弹）'
  } else if (rsi > 70) {
    signal = '超买（注意回调）'
  } else if (rsi > 50) {
    signal = '偏多'
  } else {
    signal = '偏空'
  }
  
  return { value: rsi, signal }
}

/**
 * 计算 CCI
 */
function calculateCCI(data: KLineItem[], period: number = 14): TechnicalIndicators['cci'] {
  if (data.length < period) {
    return { value: 0, signal: '数据不足' }
  }
  
  const tp = data.map(d => (d.high + d.low + d.close) / 3)
  
  let sumTP = 0
  for (let i = 0; i < period; i++) {
    sumTP += tp[tp.length - 1 - i]
  }
  const smaTP = sumTP / period
  
  const lastTP = tp[tp.length - 1]
  let meanDeviation = 0
  for (let i = 0; i < period; i++) {
    meanDeviation += Math.abs(tp[tp.length - 1 - i] - smaTP)
  }
  meanDeviation /= period
  
  const cci = meanDeviation === 0 ? 0 : (lastTP - smaTP) / (0.015 * meanDeviation)
  
  let signal = '中性'
  if (cci > 100) {
    signal = '超买区域'
  } else if (cci < -100) {
    signal = '超卖区域（反弹信号）'
  } else if (cci > 0) {
    signal = '偏多'
  } else {
    signal = '偏空'
  }
  
  return { value: cci, signal }
}

/**
 * 计算成交量指标
 */
function calculateVolume(volumes: number[]): TechnicalIndicators['volume'] {
  const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20
  const lastVolume = volumes[volumes.length - 1]
  const ratio = lastVolume / avgVolume
  
  let status = '正常'
  if (ratio > 2) {
    status = '天量'
  } else if (ratio > 1.5) {
    status = '放量'
  } else if (ratio < 0.5) {
    status = '地量'
  } else if (ratio < 0.8) {
    status = '缩量'
  }
  
  // 计算资金流向（简化版）
  const direction = ratio > 1 ? '主力净流入' : '主力净流出'
  
  return {
    ratio,
    status,
    direction
  }
}

/**
 * 计算布林带
 */
function calculateBOLL(data: KLineItem[]): TechnicalIndicators['boll'] {
  const period = 20
  const closes = data.map(d => d.close)
  
  if (closes.length < period) {
    return { upper: 0, middle: 0, lower: 0, position: 50 }
  }
  
  const recent = closes.slice(-period)
  const sma = recent.reduce((a, b) => a + b, 0) / period
  
  let sumSquares = 0
  for (const close of recent) {
    sumSquares += Math.pow(close - sma, 2)
  }
  const stdDev = Math.sqrt(sumSquares / period)
  
  const upper = sma + 2 * stdDev
  const lower = sma - 2 * stdDev
  const currentPrice = closes[closes.length - 1]
  const position = ((currentPrice - lower) / (upper - lower)) * 100
  
  return { upper, middle: sma, lower, position }
}

/**
 * 计算 ATR
 */
function calculateATR(data: KLineItem[], period: number = 14): TechnicalIndicators['atr'] {
  if (data.length < period + 1) {
    return 0
  }
  
  const trueRanges: number[] = []
  
  for (let i = 1; i < data.length; i++) {
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    )
    trueRanges.push(tr)
  }
  
  // 使用 Wilder 平滑
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period
  }
  
  return atr
}

/**
 * 形态识别
 */
function detectPattern(data: KLineItem[]): string {
  if (data.length < 50) {
    return '数据不足'
  }
  
  const recent = data.slice(-30)
  const highs = recent.map(d => d.high)
  const lows = recent.map(d => d.low)
  
  // 检测双底
  const min1 = Math.min(...lows.slice(0, 10))
  const min2 = Math.min(...lows.slice(-10))
  const maxVal = Math.max(...highs)
  
  if (Math.abs(min1 - min2) / maxVal < 0.02) {
    return '双底形态（看多信号）'
  }
  
  // 检测双顶
  const max1 = Math.max(...highs.slice(0, 10))
  const max2 = Math.max(...highs.slice(-10))
  
  if (Math.abs(max1 - max2) / maxVal < 0.02) {
    return '双顶形态（看空信号）'
  }
  
  // 检测头肩底
  const recentHighs = highs.slice(-15)
  const leftShoulder = Math.max(...recentHighs.slice(0, 5))
  const head = Math.max(...recentHighs.slice(5, 10))
  const rightShoulder = Math.max(...recentHighs.slice(10, 15))
  
  if (head > leftShoulder && head > rightShoulder && 
      Math.abs(leftShoulder - rightShoulder) / head < 0.05) {
    return '头肩底形态（强势反弹）'
  }
  
  // 检测收敛三角形
  const firstHigh = highs[0]
  const lastHigh = highs[highs.length - 1]
  const firstLow = lows[0]
  const lastLow = lows[lows.length - 1]
  
  const highAngle = Math.atan2(firstHigh - lastHigh, highs.length - 1)
  const lowAngle = Math.atan2(lastLow - firstLow, highs.length - 1)
  
  if (Math.abs(highAngle - lowAngle) < 0.1) {
    return '收敛三角形（等待突破）'
  }
  
  // 检测上升通道
  if (highAngle > 0.1 && lowAngle > 0.1) {
    return '上升通道（强势）'
  }
  
  // 检测下降通道
  if (highAngle < -0.1 && lowAngle < -0.1) {
    return '下降通道（弱势）'
  }
  
  return '无明显形态'
}

/**
 * 计算综合评分
 */
function calculateScore(data: KLineItem[]): number {
  if (data.length < 30) {
    return 50
  }
  
  let score = 50
  const closes = data.map(d => d.close)
  
  // 均线多头 +10
  const ma5 = calculateMA(closes, 5)
  const ma20 = calculateMA(closes, 20)
  if (ma5[ma5.length - 1] > ma20[ma20.length - 1]) {
    score += 10
  } else {
    score -= 10
  }
  
  // MACD 金叉 +10
  const macd = calculateMACD(closes)
  if (macd.histogram > 0) {
    score += 10
  } else {
    score -= 10
  }
  
  // RSI 超卖反弹 +10
  const rsi = calculateRSI(closes)
  if (rsi.value < 30) {
    score += 10
  } else if (rsi.value > 70) {
    score -= 10
  }
  
  // 放量 +5
  const volume = calculateVolume(data.map(d => d.volume))
  if (volume.ratio > 1.5) {
    score += 5
  }
  
  // 缩量见底 +5
  if (volume.status === '地量') {
    score += 5
  }
  
  return Math.max(0, Math.min(100, score))
}

// ==================== 辅助函数 ====================

/**
 * 简单移动平均
 */
function calculateMA(data: number[], period: number): number[] {
  const result: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(0)
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      result.push(sum / period)
    }
  }
  return result
}

/**
 * 指数移动平均
 */
function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = []
  const multiplier = 2 / (period + 1)
  
  // SMA 作为初始值
  let sum = 0
  for (let i = 0; i < period && i < data.length; i++) {
    sum += data[i]
  }
  let ema = sum / Math.min(period, data.length)
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(0)
    } else if (i === period - 1) {
      result.push(ema)
    } else {
      ema = (data[i] - ema) * multiplier + ema
      result.push(ema)
    }
  }
  
  return result
}

/**
 * 默认指标
 */
function getDefaultIndicators(): TechnicalIndicators {
  return {
    trend: '数据不足',
    maStatus: '无法判断',
    emaStatus: '无法判断',
    trendLine: '无法判断',
    macd: { value: '数据不足', signal: '无法判断', histogram: 0 },
    kdj: { k: 50, d: 50, j: 50, signal: '数据不足' },
    rsi: { value: 50, signal: '数据不足' },
    cci: { value: 0, signal: '数据不足' },
    volume: { ratio: 1, status: '正常', direction: '中性' },
    boll: { upper: 0, middle: 0, lower: 0, position: 50 },
    atr: 0,
    pattern: '数据不足',
    score: 50
  }
}

export default {
  calculateTechnicalIndicators
}