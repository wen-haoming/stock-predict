import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { loadProjectEnv, maskApiKeyPreview } from '../src/env/loadProjectEnv.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

loadProjectEnv(import.meta.url)

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(express.json())

// API 路由
app.get('/api/health', (req, res) => {
  const hasAiKey = Boolean(
    process.env.MINIMAX_API_KEY ||
      process.env.AI_API_KEY ||
      process.env.ANALYSIS_API_KEY ||
      process.env.OPENAI_API_KEY
  )
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    aiConfigured: hasAiKey,
    aiKeyHint: maskApiKeyPreview()
  })
})

// 股票数据 API（必须带 market，否则港股/美股会用错行情源）
app.get('/api/stock/:code', async (req, res) => {
  try {
    const { code } = req.params
    const q = req.query.market
    const market =
      q === 'HK' || q === 'US' || q === 'A' ? q : 'A'
    const { getStockQuote, getStockKLine } = await import('../src/services/index.js')

    const quote = await getStockQuote(code, market)
    const kline = await getStockKLine(code, market, 'day')

    res.json({ quote, kline })
  } catch (error: any) {
    console.error('获取股票数据失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// AI 分析 API
app.post('/api/analyze', async (req, res) => {
  try {
    const { code, market } = req.body
    const { analyzeStock } = await import('../src/ai/analyzer.js')

    const result = await analyzeStock(code, market || 'A')
    if (!result) {
      return res.status(502).json({ error: '分析未完成：行情/AI 调用失败，请检查 MINIMAX_API_KEY 与网络' })
    }
    res.json(result)
  } catch (error: any) {
    console.error('分析失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 搜索股票 API
app.get('/api/search', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.set('Pragma', 'no-cache')

    const { keyword, market } = req.query
    const kw = typeof keyword === 'string' ? keyword.trim() : ''
    if (!kw) {
      return res.json([])
    }
    const { searchStock } = await import('../src/services/index.js')
    const m = market === 'A' || market === 'HK' || market === 'US' ? market : 'A'
    const results = await searchStock(kw, m)
    res.json(results)
  } catch (error: any) {
    console.error('搜索失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 事件时间线（服务端 getEventData，非写死 mock）
app.get('/api/timeline/:code', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store')
    const { code } = req.params
    const q = req.query.market
    const market =
      q === 'HK' || q === 'US' || q === 'A' ? q : 'A'
    const { getEventData } = await import('../src/factors/event.js')
    const { buildTimelineFromEventData } = await import('../src/services/timelineFromEvents.js')
    const data = await getEventData(code, market)
    res.json(buildTimelineFromEventData(data))
  } catch (error: any) {
    console.error('时间线失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 因子数据 API
app.get('/api/factors', async (req, res) => {
  try {
    const { getMacroData } = await import('../src/factors/macro.js')
    const { getFundData } = await import('../src/factors/fund.js')
    const { getCycleData } = await import('../src/factors/cycle.js')
    
    const [macro, fund, cycle] = await Promise.all([
      getMacroData().catch(() => null),
      getFundData().catch(() => null),
      getCycleData().catch(() => null)
    ])
    
    res.json({ macro, fund, cycle })
  } catch (error: any) {
    console.error('获取因子数据失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 静态文件服务（生产环境）
if (process.env.NODE_ENV === 'production') {
  const clientDist = join(__dirname, '../../dist')
  app.use(express.static(clientDist))
  app.get('*', (req, res) => {
    res.sendFile(join(clientDist, 'index.html'))
  })
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Stock Predict 服务器运行在 http://localhost:${PORT}`)
  console.log(`   AI 密钥状态: ${maskApiKeyPreview()}`)
})

export default app