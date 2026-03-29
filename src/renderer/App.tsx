import React, { useState, useCallback, useEffect } from 'react'
import { Layout, Typography, Button, Space, message, Segmented, Tooltip } from 'antd'
import { SettingOutlined, ThunderboltOutlined, HeartOutlined, HistoryOutlined } from '@ant-design/icons'
import StockSearch from './components/StockSearch'
import StockChart from './components/StockChart'
import TimelineView from './components/TimelineView'
import FactorPanel from './components/FactorPanel'
import AnalysisResult from './components/AnalysisResult'
import { watchlist } from '../db'

const { Header, Content } = Layout

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000'

function App() {
  const [stockCode, setStockCode] = useState('')
  const [market, setMarket] = useState<'A' | 'HK' | 'US'>('A')
  const [loading, setLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [factors, setFactors] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'chart' | 'timeline'>('chart')
  const [quote, setQuote] = useState<any>(null)
  const [klineData, setKlineData] = useState<any[]>([])
  const [watchlistData, setWatchlistData] = useState<any[]>([])
  const [recentPredictions, setRecentPredictions] = useState<any[]>([])
  const [dbReady, setDbReady] = useState(false)

  // 初始化数据库
  useEffect(() => {
    const initDb = async () => {
      try {
        const data = await watchlist.getAll()
        setWatchlistData(data)
        setDbReady(true)
      } catch (error) {
        console.error('初始化数据库失败:', error)
        setDbReady(true) // 继续运行，不阻塞
      }
    }
    initDb()
  }, [])

  // 搜索股票
  const handleSearch = useCallback(async (code: string, m: 'A' | 'HK' | 'US') => {
    if (!code.trim()) {
      message.warning('请输入股票代码')
      return
    }
    
    setStockCode(code)
    setMarket(m)
    setLoading(true)
    setAnalysisResult(null)
    setQuote(null)
    setKlineData([])
    
    try {
      const enc = encodeURIComponent(code)
      const stockRes = await fetch(`${API_BASE}/api/stock/${enc}?market=${m}`)
      if (!stockRes.ok) {
        message.error('加载行情失败，请确认后端已启动（pnpm dev）且代码与市场一致')
        setAnalysisResult(null)
        return
      }
      const stockData = await stockRes.json()
      setQuote(stockData.quote)
      setKlineData(stockData.kline || [])

      const analyzeRes = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, market: m })
      })
      const analysisBody = await analyzeRes.json().catch(() => null)
      if (!analyzeRes.ok) {
        setAnalysisResult(null)
        message.error(
          typeof analysisBody?.error === 'string' ? analysisBody.error : `AI 分析失败（${analyzeRes.status}）`
        )
        return
      }
      setAnalysisResult(analysisBody)
    } catch (error: any) {
      console.error(error)
      setAnalysisResult(null)
      message.error('请求失败，请检查网络与后端服务')
    } finally {
      setLoading(false)
    }
  }, [])

  // 切换市场
  const handleMarketChange = (m: 'A' | 'HK' | 'US') => {
    setMarket(m)
    setStockCode('')
    setAnalysisResult(null)
    setQuote(null)
  }

  // 添加收藏
  const handleAddWatchlist = async () => {
    if (!stockCode) return
    try {
      await watchlist.add(stockCode, market, quote?.name)
      const data = await watchlist.getAll()
      setWatchlistData(data)
      message.success('已添加到收藏')
    } catch (error) {
      message.error('添加收藏失败')
    }
  }

  // 加载收藏的股票
  const loadWatchlistItem = async (item: any) => {
    setStockCode(item.code)
    setMarket(item.market as 'A' | 'HK' | 'US')
    await handleSearch(item.code, item.market as 'A' | 'HK' | 'US')
  }

  const isWatched = watchlistData.some(w => w.code === stockCode && w.market === market)
  const marketOptions = [
    { value: 'A', label: 'A股' },
    { value: 'HK', label: '港股' },
    { value: 'US', label: '美股' }
  ]

  return (
    <Layout className="min-h-screen bg-[#0d1117]">
      {/* Header */}
      <Header className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-[#161b22] to-[#1a1f29] border-b border-[#30363d]">
        <Space>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#58a6ff] to-[#3fb950] flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-[#58a6ff30]">
              📈
            </div>
            <div>
              <Typography.Title level={4} className="!mb-0 !text-[#c9d1d9]">
                Stock Predict
              </Typography.Title>
              <Typography.Text className="text-xs text-[#8b949e]">
                股票拐点预测 · 买入预期，卖出事实
              </Typography.Text>
            </div>
          </div>
        </Space>
        
        <Space size="middle">
          <Segmented
            value={market}
            onChange={(val) => handleMarketChange(val as 'A' | 'HK' | 'US')}
            options={marketOptions}
          />
          
          <StockSearch
            market={market}
            value={stockCode}
            placeholder={market === 'A' ? '输入代码，如 600519' : market === 'HK' ? '输入代码，如 00700' : '输入代码，如 AAPL'}
            onChange={(code) => setStockCode(code)}
            onSearch={handleSearch}
          />
          
          <Button 
            type="primary" 
            onClick={() => handleSearch(stockCode, market)}
            loading={loading}
            icon={<ThunderboltOutlined />}
            className="!bg-gradient-to-r !from-[#58a6ff] !to-[#3fb950] !border-0 !font-medium"
          >
            分析
          </Button>
          
          <Tooltip title="收藏">
            <Button 
              icon={<HeartOutlined style={{ color: isWatched ? '#f85149' : '#8b949e' }} />}
              onClick={handleAddWatchlist}
              type="text"
              disabled={!stockCode}
            />
          </Tooltip>
          
          <Button icon={<HistoryOutlined />} type="text" className="text-[#8b949e]" />
          <Button icon={<SettingOutlined />} type="text" className="text-[#8b949e]" />
        </Space>
      </Header>

      {/* Content */}
      <Content className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)]">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-[#30363d] border-t-[#58a6ff] rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl">📊</span>
              </div>
            </div>
            <Typography.Text className="text-[#c9d1d9] mt-6 text-lg">正在分析 {stockCode}...</Typography.Text>
            <Typography.Text className="text-[#8b949e] mt-2">结合宏观、行业、技术、基本面综合分析</Typography.Text>
          </div>
        ) : stockCode ? (
          <div className="grid grid-cols-12 gap-4">
            {/* 左侧 - 因子面板 + 收藏 */}
            <div className="col-span-3">
              <FactorPanel factors={factors} onChange={setFactors} loading={false} />
              
              {/* 收藏栏 */}
              {watchlistData.length > 0 && (
                <div className="mt-4 bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[#f0883e]">⭐</span>
                    <Typography.Text strong className="text-[#c9d1d9]">我的收藏</Typography.Text>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {watchlistData.slice(0, 5).map((item) => (
                      <div 
                        key={`${item.code}-${item.market}`}
                        className="flex items-center justify-between p-2 rounded bg-[#0d1117] hover:bg-[#21262d] cursor-pointer transition-colors"
                        onClick={() => loadWatchlistItem(item)}
                      >
                        <div>
                          <Typography.Text className="text-[#c9d1d9] font-medium">{item.code}</Typography.Text>
                          <Typography.Text className="text-[#8b949e] text-xs ml-2">{item.name || ''}</Typography.Text>
                        </div>
                        <Typography.Text className="text-xs text-[#58a6ff]">
                          {item.market === 'A' ? 'A股' : item.market === 'HK' ? '港股' : '美股'}
                        </Typography.Text>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 中间 - 图表区域 */}
            <div className="col-span-6 space-y-4">
              <div className="bg-[#161b22] rounded-lg p-4 border border-[#30363d]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-[#0d1117] rounded-lg p-1">
                      <button
                        onClick={() => setActiveTab('chart')}
                        className={`px-4 py-2 rounded-md transition-all ${
                          activeTab === 'chart' 
                            ? 'bg-[#58a6ff] text-white shadow-lg shadow-[#58a6ff30]' 
                            : 'text-[#8b949e] hover:text-[#c9d1d9]'
                        }`}
                      >
                        📊 K线图
                      </button>
                      <button
                        onClick={() => setActiveTab('timeline')}
                        className={`px-4 py-2 rounded-md transition-all ${
                          activeTab === 'timeline' 
                            ? 'bg-[#58a6ff] text-white shadow-lg shadow-[#58a6ff30]' 
                            : 'text-[#8b949e] hover:text-[#c9d1d9]'
                        }`}
                      >
                        📅 时间线
                      </button>
                    </div>
                  </div>
                  
                  {quote && (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Typography.Text className="text-2xl font-bold text-[#c9d1d9]">{quote.price}</Typography.Text>
                        <Typography.Text className={`ml-2 ${quote.change >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
                          {quote.change >= 0 ? '+' : ''}{quote.change?.toFixed(2)} ({quote.changePercent?.toFixed(2)}%)
                        </Typography.Text>
                      </div>
                      <div className="text-xs text-[#8b949e]">
                        <div>高 {quote.high?.toFixed(2)}</div>
                        <div>低 {quote.low?.toFixed(2)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {activeTab === 'chart' ? (
                <StockChart stockCode={stockCode} klineData={klineData.length > 0 ? klineData : undefined} loading={loading} />
              ) : (
                <TimelineView stockCode={stockCode} market={market} />
              )}
            </div>

            {/* 右侧 - 分析结果 */}
            <div className="col-span-3">
              <AnalysisResult 
                trend={analysisResult?.trend}
                phase={analysisResult?.phase}
                trendReason={analysisResult?.trendReason}
                prediction={analysisResult?.prediction}
                suggestion={analysisResult?.suggestion}
                risks={analysisResult?.riskFactors}
              />
              
              {/* 股票信息卡片 */}
              <div className="mt-4 bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#58a6ff]">📋</span>
                  <Typography.Text strong className="text-[#c9d1d9]">股票信息</Typography.Text>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Typography.Text className="text-[#8b949e]">代码</Typography.Text>
                    <Typography.Text className="text-[#c9d1d9] font-medium">{stockCode}</Typography.Text>
                  </div>
                  <div className="flex justify-between">
                    <Typography.Text className="text-[#8b949e]">市场</Typography.Text>
                    <Typography.Text className="text-[#c9d1d9]">{market === 'A' ? 'A股' : market === 'HK' ? '港股' : '美股'}</Typography.Text>
                  </div>
                  {quote?.name && (
                    <div className="flex justify-between">
                      <Typography.Text className="text-[#8b949e]">名称</Typography.Text>
                      <Typography.Text className="text-[#c9d1d9]">{quote.name}</Typography.Text>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)]">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#58a6ff20] to-[#3fb95020] flex items-center justify-center animate-pulse">
                <span className="text-6xl">📈</span>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#f0883e] flex items-center justify-center text-white text-sm font-bold shadow-lg">
                AI
              </div>
            </div>
            
            <Typography.Title level={2} className="!text-[#c9d1d9] mb-2">股票拐点预测</Typography.Title>
            <Typography.Text className="text-[#8b949e] mb-8 text-center max-w-md">
              基于宏观因子、行业因子、技术因子和基本面，<br />
              运用 AI 智能分析预测股票拐点位置
            </Typography.Text>
            
            <div className="mb-8 px-4 py-2 bg-[#f0883e15] border border-[#f0883e30] rounded-lg">
              <Typography.Text className="text-[#f0883e]">💡 核心原则：买入的是预期，卖出的是事实</Typography.Text>
            </div>
            
            <div className="flex gap-6">
              {[
                { icon: '🌐', title: '宏观因子', desc: 'Fed政策、地缘政治', color: '#58a6ff' },
                { icon: '🏭', title: '行业因子', desc: '行业趋势、上游价格', color: '#a371f7' },
                { icon: '📊', title: '技术因子', desc: 'MA、MACD、KDJ', color: '#3fb950' },
                { icon: '📈', title: '基本面因子', desc: '业绩、估值', color: '#f0883e' }
              ].map((item, i) => (
                <div 
                  key={i}
                  className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 text-center w-36 hover:border-[#58a6ff] hover:shadow-lg hover:shadow-[#58a6ff10] transition-all cursor-pointer"
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto mb-3"
                    style={{ backgroundColor: item.color + '20' }}
                  >
                    {item.icon}
                  </div>
                  <Typography.Text strong className="text-[#c9d1d9] block">{item.title}</Typography.Text>
                  <Typography.Text className="text-xs text-[#8b949e]">{item.desc}</Typography.Text>
                </div>
              ))}
            </div>
          </div>
        )}
      </Content>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#161b22] to-[#1a1f29] border-t border-[#30363d] px-6 py-2">
        <div className="flex items-center justify-between text-xs text-[#8b949e]">
          <Space>
            <Typography.Text>股票拐点预测系统 v1.0 (Web版 · IndexedDB)</Typography.Text>
            <span className="text-[#30363d]">|</span>
            <Typography.Text>数据来源：东方财富、新浪财经</Typography.Text>
          </Space>
          <Space>
            <Typography.Text className="text-[#f0883e]">💡 买入的是预期，卖出的是事实</Typography.Text>
          </Space>
        </div>
      </div>
    </Layout>
  )
}

export default App