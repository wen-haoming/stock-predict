import React, { useState, useMemo } from 'react'
import { Card, Typography, Space, Tag, Badge, Segmented } from 'antd'
import { ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons'

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
  items?: TimelineItem[]
}

const typeConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  fact: { color: '#58a6ff', label: '事实', icon: <CheckCircleOutlined /> },
  expectation: { color: '#f0883e', label: '预期', icon: <ExclamationCircleOutlined /> },
  pivot: { color: '#3fb950', label: '拐点', icon: <ClockCircleOutlined /> },
  report: { color: '#a371f7', label: '财报', icon: <ClockCircleOutlined /> }
}

const mockTimelineItems: TimelineItem[] = [
  { id: '1', date: '2026-03-20', type: 'fact', title: '年报发布', description: '营收 1200 亿，同比增长 15%', status: '已确认', impact: 'positive' },
  { id: '2', date: '2026-03-25', type: 'report', title: '一季报披露', description: '4月15日前预计发布', status: '待发布', impact: 'neutral' },
  { id: '3', date: '2026-04-10', type: 'expectation', title: '一季报预期', description: '市场预期业绩超预期', status: '预期', impact: 'positive' },
  { id: '4', date: '2026-04-20', type: 'pivot', title: '拐点预测', description: '均线粘合 + 宏观利好，股价可能启动', status: '预测', impact: 'positive' },
  { id: '5', date: '2026-05-01', type: 'expectation', title: '行业政策', description: '可能的行业扶持政策出台', status: '预期', impact: 'positive' },
  { id: '6', date: '2026-06-15', type: 'report', title: '中报披露', description: '关注业绩增速', status: '待发布', impact: 'neutral' }
]

const TimelineView: React.FC<TimelineViewProps> = ({ stockCode, items }) => {
  const [filter, setFilter] = useState<'all' | 'fact' | 'expectation' | 'pivot'>('all')
  
  const displayItems = items || mockTimelineItems
  
  const filteredItems = useMemo(() => {
    if (filter === 'all') return displayItems
    return displayItems.filter(item => item.type === filter)
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
          onChange={(val) => setFilter(val as any)}
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
      <div className="bg-[#0d1117] rounded-lg p-4 max-h-96 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center text-[#8b949e] py-8">
            暂无数据
          </div>
        ) : (
          <div className="relative">
            {/* 时间线 */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-[#30363d]" />
            
            <div className="space-y-4">
              {filteredItems.map((item, index) => {
                const config = typeConfig[item.type]
                
                return (
                  <div key={item.id} className="relative pl-10">
                    {/* 时间线节点 */}
                    <div 
                      className="absolute left-2 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                      style={{ 
                        backgroundColor: '#0d1117',
                        borderColor: config.color,
                        top: 2
                      }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                    </div>
                    
                    {/* 内容卡片 */}
                    <div 
                      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 hover:border-[#58a6ff] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Text strong className="text-[#c9d1d9]">{item.title}</Text>
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
      
      {/* 底部图例 */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-[#30363d]">
        <Space size="middle">
          <span className="flex items-center gap-1 text-xs text-[#8b949e]">
            <span className="w-2 h-2 rounded-full bg-[#58a6ff]"></span>
            事实（已确认）
          </span>
          <span className="flex items-center gap-1 text-xs text-[#8b949e]">
            <span className="w-2 h-2 rounded-full bg-[#f0883e]"></span>
            预期（待验证）
          </span>
          <span className="flex items-center gap-1 text-xs text-[#8b949e]">
            <span className="w-2 h-2 rounded-full bg-[#3fb950]"></span>
            拐点（预测）
          </span>
        </Space>
      </div>
    </Card>
  )
}

export default TimelineView