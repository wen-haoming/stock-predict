import React from 'react'
import { Card, Typography, Space, Tag, Alert, Progress, Divider } from 'antd'
import { BulbOutlined, WarningOutlined, RiseOutlined, FallOutlined, ThunderboltOutlined, ClockCircleOutlined } from '@ant-design/icons'

const { Text, Title } = Typography

interface PredictionData {
  date: string | null
  confidence: number
  reason: string
}

interface SuggestionData {
  type: 'buy' | 'sell' | 'hold'
  price: string | null
  date: string | null
  reason: string
}

interface AnalysisResultProps {
  trend?: string
  phase?: string
  trendReason?: string
  prediction?: PredictionData
  suggestion?: SuggestionData
  risks?: string[]
}

const mockResult: AnalysisResultProps = {
  trend: '下跌趋势',
  phase: '预期阶段',
  trendReason: '均线空头排列，MACD 死叉，量能萎缩',
  prediction: {
    date: '2026-04-20',
    confidence: 72,
    reason: '技术面超卖 + 宏观预期改善 + 业绩拐点将至'
  },
  suggestion: {
    type: 'buy',
    price: '175.00',
    date: '2026-04-15',
    reason: '当前处于预期阶段，年报已跌完，逢低布局等待拐点'
  },
  risks: ['消费复苏不及预期', '行业政策变化', '流动性风险']
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ 
  trend, 
  phase, 
  trendReason, 
  prediction, 
  suggestion, 
  risks 
}) => {
  const hasData = trend || phase || prediction || suggestion || risks
  const data = hasData 
    ? { trend, phase, trendReason, prediction, suggestion, risks } 
    : mockResult

  const getTrendColor = (t?: string) => {
    if (!t) return '#f0883e'
    if (t.includes('上涨')) return '#3fb950'
    if (t.includes('下跌')) return '#f85149'
    return '#f0883e'
  }

  const getPhaseIcon = (p?: string) => {
    if (!p) return '⚖️'
    if (p.includes('预期')) return '📈'
    if (p.includes('事实')) return '📉'
    return '⚖️'
  }

  const getSuggestionStyle = (type: string) => {
    if (type === 'buy') return { bg: '#3fb95015', border: '#3fb950', icon: '🟢', text: '#3fb950' }
    if (type === 'sell') return { bg: '#f8514915', border: '#f85149', icon: '🔴', text: '#f85149' }
    return { bg: '#f0883e15', border: '#f0883e', icon: '🟡', text: '#f0883e' }
  }

  const suggestionStyle = getSuggestionStyle(data.suggestion?.type || 'hold')

  return (
    <Card 
      className="bg-[#161b22] border-[#30363d]"
      title={
        <Space>
          <BulbOutlined className="text-[#f0883e]" />
          <span className="text-[#c9d1d9]">AI 分析</span>
        </Space>
      }
    >
      <div className="space-y-4">
        {/* 趋势 & 阶段 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0d1117] rounded-lg p-3 text-center">
            <Text className="text-xs text-[#8b949e] block mb-1">当前趋势</Text>
            <Text 
              strong 
              className="text-base"
              style={{ color: getTrendColor(data.trend || '') }}
            >
              {data.trend || '-'}
            </Text>
          </div>
          <div className="bg-[#0d1117] rounded-lg p-3 text-center">
            <Text className="text-xs text-[#8b949e] block mb-1">当前阶段</Text>
            <Space size="small" className="justify-center">
              <span className="text-lg">{getPhaseIcon(data.phase || '')}</span>
              <Text strong className="text-base text-[#f0883e]">
                {data.phase || '-'}
              </Text>
            </Space>
          </div>
        </div>

        {/* 趋势理由 */}
        {data.trendReason && (
          <div className="bg-[#0d1117] rounded-lg p-3">
            <Text className="text-xs text-[#8b949e] mb-1 block">趋势依据</Text>
            <Text className="text-sm text-[#c9d1d9]">{data.trendReason}</Text>
          </div>
        )}

        <Divider className="border-[#30363d] my-3" />

        {/* 拐点预测 */}
        {data.prediction && (
          <div className="bg-[#0d1117] rounded-lg p-4 border border-[#3fb95030]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🎯</span>
              <div>
                <Text strong className="text-[#c9d1d9]">拐点预测</Text>
                {data.prediction.date && (
                  <Tag color="green" className="ml-2 text-xs">
                    {data.prediction.confidence}% 置信度
                  </Tag>
                )}
              </div>
            </div>
            
            {data.prediction.date && (
              <div className="flex items-center gap-2 mb-3">
                <ClockCircleOutlined className="text-[#58a6ff]" />
                <Text className="text-[#c9d1d9] text-lg font-bold">
                  {data.prediction.date}
                </Text>
              </div>
            )}
            
            <Progress 
              percent={data.prediction.confidence || 0} 
              showInfo={false}
              strokeColor="#3fb950"
              trailColor="#30363d"
              size="small"
            />
            
            {data.prediction.reason && (
              <Text className="text-xs text-[#8b949e] mt-2 block">
                理由：{data.prediction.reason}
              </Text>
            )}
          </div>
        )}

        {/* 建议 */}
        {data.suggestion && (
          <div 
            className="rounded-lg p-4 border"
            style={{ backgroundColor: suggestionStyle.bg, borderColor: suggestionStyle.border }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{suggestionStyle.icon}</span>
              <Text 
                strong 
                className="text-lg"
                style={{ color: suggestionStyle.text }}
              >
                {data.suggestion.type === 'buy' ? '买入建议' : data.suggestion.type === 'sell' ? '卖出建议' : '持有建议'}
              </Text>
            </div>
            
            <div className="space-y-2">
              {data.suggestion.price && (
                <div className="flex items-center justify-between">
                  <Text className="text-[#8b949e] text-sm">建议价格</Text>
                  <Text 
                    strong 
                    style={{ color: suggestionStyle.text }}
                    className="text-lg"
                  >
                    {data.suggestion.price}
                  </Text>
                </div>
              )}
              
              {data.suggestion.date && (
                <div className="flex items-center justify-between">
                  <Text className="text-[#8b949e] text-sm">建议日期</Text>
                  <Text className="text-[#c9d1d9]">{data.suggestion.date}</Text>
                </div>
              )}
              
              {data.suggestion.reason && (
                <Text className="text-sm text-[#c9d1d9] block mt-2">
                  {data.suggestion.reason}
                </Text>
              )}
            </div>
          </div>
        )}

        {/* 风险提示 */}
        {data.risks && data.risks.length > 0 && (
          <>
            <Divider className="border-[#30363d] my-3" />
            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <WarningOutlined className="text-[#f0883e]" />
                <Text strong className="text-[#c9d1d9]">风险提示</Text>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {data.risks.map((risk, index) => (
                  <Tag 
                    key={index}
                    className="bg-[#f8514910] text-[#f85149] border-[#f8514930]"
                  >
                    ⚠️ {risk}
                  </Tag>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 核心原则 */}
        <Alert
          message={
            <div className="flex items-center gap-2">
              <ThunderboltOutlined />
              <Text strong>核心原则</Text>
            </div>
          }
          description={
            <Text className="text-sm">
              买入的是预期，卖出的是事实。当前处于<span className="text-[#f0883e]">预期阶段</span>，建议逢低布局。
            </Text>
          }
          type="info"
          className="bg-[#58a6ff10] border-[#58a6ff30]"
        />
      </div>
    </Card>
  )
}

export default AnalysisResult