import React from 'react'
import { Card, Typography, Space, Tag, Alert, Progress, Divider } from 'antd'
import {
  BulbOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'

const { Text } = Typography

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

const AnalysisResult: React.FC<AnalysisResultProps> = ({
  trend,
  phase,
  trendReason,
  prediction,
  suggestion,
  risks
}) => {
  const hasAny =
    trend != null ||
    phase != null ||
    (trendReason != null && trendReason !== '') ||
    prediction != null ||
    suggestion != null ||
    (risks != null && risks.length > 0)

  const isTechnicalFallback = Boolean(
    trendReason?.includes('非大模型') ||
      trendReason?.includes('未配置 AI') ||
      trendReason?.includes('解析失败') ||
      trendReason?.includes('AI 无有效返回')
  )

  const getTrendColor = (t?: string) => {
    if (!t || t === '数据不足') return '#f0883e'
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

  const suggestionStyle = getSuggestionStyle(suggestion?.type || 'hold')

  if (!hasAny) {
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
        <div className="py-8 px-2 text-center">
          <InfoCircleOutlined className="text-3xl text-[#8b949e] mb-3" />
          <Text className="text-[#8b949e] block">搜索股票并点击「分析」后，将在此展示结论。</Text>
        </div>
      </Card>
    )
  }

  const showPredMeta = Boolean(prediction && (prediction.date || prediction.confidence > 0))

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
      <div className="space-y-4 pb-2">
        {isTechnicalFallback && (
          <Alert
            type="warning"
            showIcon
            message="当前非大模型结论"
            description={
              <span className="text-[#c9d1d9] text-sm">
                请在项目根目录 <code className="text-[#58a6ff]">.env</code> 中设置{' '}
                <code className="text-[#58a6ff]">MINIMAX_API_KEY</code> 或{' '}
                <code className="text-[#58a6ff]">AI_API_KEY</code>（与{' '}
                <a
                  href="https://platform.minimaxi.com/user-center/payment/token-plan"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#58a6ff]"
                >
                  MiniMax 代币
                </a>
                一致），保存后<strong className="text-[#f0883e]">重启</strong>后端进程。
              </span>
            }
            className="bg-[#f0883e12] border-[#f0883e40]"
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0d1117] rounded-lg p-3 text-center min-h-[4.5rem] flex flex-col justify-center">
            <Text className="text-xs text-[#8b949e] block mb-1">当前趋势</Text>
            <Text strong className="text-base" style={{ color: getTrendColor(trend) }}>
              {trend || '—'}
            </Text>
          </div>
          <div className="bg-[#0d1117] rounded-lg p-3 text-center min-h-[4.5rem] flex flex-col justify-center">
            <Text className="text-xs text-[#8b949e] block mb-1">当前阶段</Text>
            <Space size="small" className="justify-center">
              <span className="text-lg">{getPhaseIcon(phase)}</span>
              <Text strong className="text-base text-[#f0883e]">
                {phase || '—'}
              </Text>
            </Space>
          </div>
        </div>

        {trendReason ? (
          <div className="bg-[#0d1117] rounded-lg p-3">
            <Text className="text-xs text-[#8b949e] mb-2 block">趋势依据</Text>
            <Text className="text-sm text-[#c9d1d9] leading-relaxed whitespace-pre-wrap">{trendReason}</Text>
          </div>
        ) : null}

        <Divider className="border-[#30363d] !my-4" />

        {prediction ? (
          <div className="bg-[#0d1117] rounded-lg p-4 border border-[#3fb95030] min-h-[7rem]">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-2xl">🎯</span>
              <div>
                <Text strong className="text-[#c9d1d9]">
                  拐点预测
                </Text>
                {showPredMeta && prediction.date && (
                  <Tag color="green" className="ml-2 text-xs">
                    {prediction.confidence}% 置信度
                  </Tag>
                )}
                {showPredMeta && !prediction.date && prediction.confidence > 0 && (
                  <Tag color="orange" className="ml-2 text-xs">
                    技术分 {prediction.confidence}
                  </Tag>
                )}
              </div>
            </div>

            {prediction.date ? (
              <div className="flex items-center gap-2 mb-3">
                <ClockCircleOutlined className="text-[#58a6ff]" />
                <Text className="text-[#c9d1d9] text-lg font-bold">{prediction.date}</Text>
              </div>
            ) : (
              <Text className="text-xs text-[#8b949e] block mb-3">
                大模型将在此给出预测日期与置信度（需配置 MiniMax）。
              </Text>
            )}

            {prediction.confidence != null && prediction.confidence > 0 && (
              <Progress
                percent={Math.min(100, prediction.confidence)}
                showInfo={false}
                strokeColor="#3fb950"
                trailColor="#30363d"
                size="small"
              />
            )}

            {prediction.reason ? (
              <Text className="text-xs text-[#8b949e] mt-2 block">理由：{prediction.reason}</Text>
            ) : null}
          </div>
        ) : null}

        {suggestion ? (
          <div
            className="rounded-lg p-4 border"
            style={{ backgroundColor: suggestionStyle.bg, borderColor: suggestionStyle.border }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{suggestionStyle.icon}</span>
              <Text strong className="text-lg" style={{ color: suggestionStyle.text }}>
                {suggestion.type === 'buy' ? '买入建议' : suggestion.type === 'sell' ? '卖出建议' : '持有建议'}
              </Text>
            </div>

            <div className="space-y-2">
              {suggestion.price ? (
                <div className="flex items-center justify-between">
                  <Text className="text-[#8b949e] text-sm">建议价格</Text>
                  <Text strong style={{ color: suggestionStyle.text }} className="text-lg">
                    {suggestion.price}
                  </Text>
                </div>
              ) : null}

              {suggestion.date ? (
                <div className="flex items-center justify-between">
                  <Text className="text-[#8b949e] text-sm">建议日期</Text>
                  <Text className="text-[#c9d1d9]">{suggestion.date}</Text>
                </div>
              ) : null}

              {suggestion.reason ? (
                <Text className="text-sm text-[#c9d1d9] block mt-2">{suggestion.reason}</Text>
              ) : null}
            </div>
          </div>
        ) : null}

        {risks && risks.length > 0 ? (
          <>
            <Divider className="border-[#30363d] !my-4" />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <WarningOutlined className="text-[#f0883e]" />
                <Text strong className="text-[#c9d1d9]">
                  风险提示
                </Text>
              </div>
              <div className="flex flex-wrap gap-2">
                {risks.map((risk, index) => (
                  <Tag key={index} className="bg-[#f8514910] text-[#f85149] border-[#f8514930]">
                    ⚠️ {risk}
                  </Tag>
                ))}
              </div>
            </div>
          </>
        ) : null}

        <Alert
          message={
            <div className="flex items-center gap-2">
              <ThunderboltOutlined />
              <Text strong>核心原则</Text>
            </div>
          }
          description={
            <Text className="text-sm">
              {isTechnicalFallback
                ? '完整 AI 研判依赖 MiniMax：配置密钥并重启后端后重新点击「分析」。请勿将密钥提交到 Git。'
                : '买入的是预期，卖出的是事实。请结合行情与风险自行决策。'}
            </Text>
          }
          type="info"
          className="bg-[#58a6ff10] border-[#58a6ff30] mt-2"
        />
      </div>
    </Card>
  )
}

export default AnalysisResult
