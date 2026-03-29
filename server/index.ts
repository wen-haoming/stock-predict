import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(express.json())

// API 路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// 股票数据 API
app.get('/api/stock/:code', async (req, res) => {
  try {
    const { code } = req.params
    const { getStockQuote, getStockKLine } = await import('../src/services/index.js')
    
    const quote = await getStockQuote(code, 'A')
    const kline = await getStockKLine(code, 'A', 'day')
    
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
    res.json(result)
  } catch (error: any) {
    console.error('分析失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 搜索股票 API
app.get('/api/search', async (req, res) => {
  try {
    const { keyword, market } = req.query
    const { searchStock } = await import('../src/services/index.js')
    
    const results = await searchStock(keyword as string, market as any)
    res.json(results)
  } catch (error: any) {
    console.error('搜索失败:', error)
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
})

export default app