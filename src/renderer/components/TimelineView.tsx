import React, { useState, useMemo, useEffect } from 'react'
import { Card, Typography, Space, Tag, Badge, Segmented, Spin, Empty } from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons'

const { Text } = Typography

interface TimelineItem {
  id: string
  date: string
  type: 'fact' | 'expectation' | 'pivot' | 'report'
  title: string
  description?: string
  status?: string
  impact?: 'positive' | 'negative' | 'neutral'
}

interface TimelineViewProps {
  stockCode?: string
  market?: 'A' | 'HK' | 'US'
}

const typeConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  fact: { color: '#58a6ff', label: '事实', icon: <CheckCircleOutlined /> },
  expectation: { color: '#f0883e', label: '预期', icon: <ExclamationCircleOutlined /> },
  pivot: { color: '#3fb950', label: '拐点', icon: <ClockCircleOutlined /> },
  report: { color: '#a371f7', label: '财报', icon: <ClockCircleOutlined /> }
}

const TimelineView: React.FC<TimelineViewProps> = ({ stockCode, market = 'A' }) => {
  const [filter, setFilter] = useState<'all' | 'fact' | 'expectation' | 'pivot'>('all')
  const [items, setItems] = useState<TimelineItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!stockCode?.trim()) {
      setItems(null)
      setError(null)
      return
    }
    const ac = new AbortController()
    setLoading(true)
    setError(null)
    const enc = encodeURIComponent(stockCode.trim())
    fetch(`/api/timeline/${enc}?market=${market}`, { signal: ac.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setItems(Array.isArray(data) ? data : [])
      })
      .catch((e) => {
        if (e.name === 'AbortError') return
        console.error(e)
        setError('时间线加载失败')
        setItems([])
      })
      .finally(() => setLoading(false))

    return () => ac.abort()
  }, [stockCode, market])

  const displayItems = items ?? []

  const filteredItems = useMemo(() => {
    if (filter === 'all') return displayItems
    return displayItems.filter((item) => item.type === filter)
  }, [filter, displayItems])

  const getImpactIcon = (impact?: 'positive' | 'negative' | 'neutral') => {
    if (impact === 'positive') return <RiseOutlined className="text-[#3fb950]" />
    if (impact === 'negative') return <FallOutlined className="text-[#f85149]" />
    return null
  }

  const getBadgeStatus = (status?: string) => {
    if (status === '已确认') return 'success'
    if (status === '预测') return 'processing'
    return 'default'
  }

  return (
    <Card
      className="bg-[#161b22] border-[#30363d]"
      title={
        <Space>
          <span className="text-xl">📅</span>
          <span className="text-[#c9d1d9]">时间线</span>
          {stockCode && <Tag color="blue">{stockCode}</Tag>}
        </Space>
      }
      extra={
        <Segmented
          value={filter}
          onChange={(val) => setFilter(val as typeof filter)}
          options={[
            { label: '全部', value: 'all' },
            { label: '事实', value: 'fact' },
            { label: '预期', value: 'expectation' },
            { label: '拐点', value: 'pivot' }
          ]}
          size="small"
        />
      }
    >
      <div className="bg-[#0d1117] rounded-lg p-4 max-h-96 overflow-y-auto min-h-[12rem]">
        {!stockCode ? (
          <div className="text-center text-[#8b949e] py-8">请先选择股票</div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <Spin />
          </div>
        ) : error ? (
          <div className="text-center text-[#f85149] py-8">{error}</div>
        ) : filteredItems.length === 0 ? (
          <Empty description={<span className="text-[#8b949e]">暂无披露/事件数据</span>} className="py-6" />
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-[#30363d]" />

            <div className="space-y-4">
              {filteredItems.map((item) => {
                const config = typeConfig[item.type]

                return (
                  <div key={item.id} className="relative pl-10">
                    <div
                      className="absolute left-2 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                      style={{
                        backgroundColor: '#0d1117',
                        borderColor: config.color,
                        top: 2
                      }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                    </div>

                    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 hover:border-[#58a6ff] transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Text strong className="text-[#c9d1d9]">
                              {item.title}
                            </Text>
                            {getImpactIcon(item.impact)}
                          </div>
                          {item.description && (
                            <Text className="text-[#8b949e] text-sm block">{item.description}</Text>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <Text className="text-xs text-[#58a6ff]">{item.date}</Text>
                          <Tag
                            color={item.type === 'fact' ? 'blue' : item.type === 'pivot' ? 'green' : 'orange'}
                            className="text-xs m-0"
                          >
                            {config.label}
                          </Tag>
                        </div>
                      </div>

                      {item.status && (
                        <div className="mt-2 flex items-center gap-1">
                          <Badge status={getBadgeStatus(item.status)} />
                          <Text className="text-xs text-[#8b949e]">{item.status}</Text>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-[#30363d]">
        <Space size="middle">
          <span className="flex items-center gap-1 text-xs text-[#8b949e]">
            <span className="w-2 h-2 rounded-full bg-[#58a6ff]" />
            事实（已确认）
          </span>
          <span className="flex items-center gap-1 text-xs text-[#8b949e]">
            <span className="w-2 h-2 rounded-full bg-[#f0883e]" />
            预期（待验证）
          </span>
          <span className="flex items-center gap-1 text-xs text-[#8b949e]">
            <span className="w-2 h-2 rounded-full bg-[#3fb950]" />
            拐点（预测）
          </span>
        </Space>
      </div>
    </Card>
  )
}

export default TimelineView
