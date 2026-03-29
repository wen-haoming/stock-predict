import React, { useState, useEffect } from 'react'
import { Card, Typography, Slider, Space, Tag, InputNumber, Tooltip, Collapse, Spin, Badge } from 'antd'
import { SettingOutlined, InfoCircleOutlined, LockOutlined, UnlockOutlined, ReloadOutlined } from '@ant-design/icons'
import { FACTOR_DETAILS, DEFAULT_WEIGHTS, type FactorWeights } from '../../factors'

const { Text } = Typography

interface FactorItem {
  key: string
  name: string
  weight: number
  description?: string
  locked?: boolean
  value?: string | number
  signal?: 'bullish' | 'bearish' | 'neutral'
}

interface FactorPanelProps {
  factors?: FactorItem[]
  onChange?: (factors: FactorItem[]) => void
  onReload?: () => void
  loading?: boolean
}

const categoryConfig: Record<string, { label: string; icon: string; color: string }> = {
  macro: { label: '宏观因子', icon: '🌐', color: '#58a6ff' },
  industry: { label: '行业因子', icon: '🏭', color: '#a371f7' },
  technical: { label: '技术因子', icon: '📊', color: '#3fb950' },
  financial: { label: '基本面因子', icon: '📈', color: '#f0883e' },
  fund: { label: '资金面因子', icon: '💰', color: '#f778ba' },
  cycle: { label: '周期因子', icon: '🔄', color: '#79c0ff' },
  event: { label: '事件驱动', icon: '📅', color: '#7ee787' }
}

const FactorPanel: React.FC<FactorPanelProps> = ({ 
  factors, 
  onChange,
  onReload,
  loading = false
}) => {
  // 初始化所有因子
  const [localFactors, setLocalFactors] = useState<FactorItem[]>(() => {
    if (factors && factors.length > 0) return factors
    
    const allFactors: FactorItem[] = []
    Object.entries(FACTOR_DETAILS).forEach(([category, config]) => {
      const budget = DEFAULT_WEIGHTS[category as keyof FactorWeights]
      const sumW = config.factors.reduce((s, f) => s + f.weight, 0) || 1
      config.factors.forEach((factor) => {
        const w = Math.max(1, Math.round((factor.weight / sumW) * budget))
        allFactors.push({
          key: factor.key,
          name: factor.name,
          weight: w,
          description: factor.description,
          locked: false,
          value: '-',
          signal: 'neutral'
        })
      })
    })
    return allFactors
  })

  const [collapsedKeys, setCollapsedKeys] = useState<string[]>(['macro', 'technical'])
  const [showDetails, setShowDetails] = useState(false)

  // 计算各类因子总权重
  const getCategoryFactors = (category: string): FactorItem[] => {
    const config = FACTOR_DETAILS[category as keyof typeof FACTOR_DETAILS]
    if (!config) return []
    return localFactors.filter(f => config.factors.some(cf => cf.key === f.key))
  }

  const calculateCategoryWeight = (factors: FactorItem[]) => {
    return factors.reduce((sum, f) => sum + f.weight, 0)
  }

  const calculateCategorySignal = (factors: FactorItem[]) => {
    const bullish = factors.filter(f => f.signal === 'bullish').length
    const bearish = factors.filter(f => f.signal === 'bearish').length
    if (bullish > bearish + 1) return 'bullish'
    if (bearish > bullish + 1) return 'bearish'
    return 'neutral'
  }

  const totalWeight = localFactors.reduce((sum, f) => sum + f.weight, 0)

  const updateWeight = (key: string, weight: number) => {
    const updated = localFactors.map(f => f.key === key ? { ...f, weight } : f)
    setLocalFactors(updated)
    onChange?.(updated)
  }

  const toggleLock = (key: string) => {
    const updated = localFactors.map(f => f.key === key ? { ...f, locked: !f.locked } : f)
    setLocalFactors(updated)
    onChange?.(updated)
  }

  const getSignalColor = (signal?: string) => {
    switch (signal) {
      case 'bullish': return '#3fb950'
      case 'bearish': return '#f85149'
      default: return '#8b949e'
    }
  }

  const getSignalIcon = (signal?: string) => {
    switch (signal) {
      case 'bullish': return '📈'
      case 'bearish': return '📉'
      default: return '⚖️'
    }
  }

  return (
    <Card 
      className="bg-[#161b22] border-[#30363d]"
      title={
        <Space>
          <SettingOutlined className="text-[#58a6ff]" />
          <span className="text-[#c9d1d9]">多因子面板</span>
          {loading && <Spin size="small" />}
        </Space>
      }
      extra={
        <Space size="small">
          <Text className="text-xs text-[#8b949e]">总权重</Text>
          <Tag color={totalWeight === 100 ? 'green' : totalWeight > 100 ? 'red' : 'orange'} className="text-xs">
            {totalWeight}%
          </Tag>
          <Tooltip title="刷新数据">
            <button 
              onClick={onReload}
              className="text-[#8b949e] hover:text-[#58a6ff] transition-colors p-1"
              disabled={loading}
            >
              <ReloadOutlined spin={loading} />
            </button>
          </Tooltip>
        </Space>
      }
    >
      {/* 总览 */}
      <div className="mb-4 p-3 bg-gradient-to-r from-[#58a6ff10] to-[#3fb95010] rounded-lg border border-[#30363d]">
        <div className="flex items-center justify-between">
          <Text className="text-[#8b949e]">综合信号</Text>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getSignalIcon(calculateCategorySignal(localFactors))}</span>
            <Text 
              strong 
              style={{ color: getSignalColor(calculateCategorySignal(localFactors)) }}
              className="text-lg"
            >
              {calculateCategorySignal(localFactors) === 'bullish' ? '偏多' : 
               calculateCategorySignal(localFactors) === 'bearish' ? '偏空' : '中性'}
            </Text>
          </div>
        </div>
      </div>

      {/* 快速预设 */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Tag 
          className="cursor-pointer hover:bg-[#58a6ff20]"
          onClick={() => {
            const updated = localFactors.map(f => ({ ...f, weight: Math.round(100 / localFactors.length) }))
            setLocalFactors(updated)
            onChange?.(updated)
          }}
        >
          均分
        </Tag>
        <Tag 
          className="cursor-pointer hover:bg-[#3fb95020]"
          onClick={() => {
            const updated = localFactors.map(f => ({
              ...f,
              weight: f.key.startsWith('technical') || f.key.startsWith('kdj') || f.key.startsWith('macd') 
                ? 35 : f.key.startsWith('fund') || f.key.startsWith('northbound')
                ? 30 : 15
            }))
            setLocalFactors(updated)
            onChange?.(updated)
          }}
        >
          技术+资金优先
        </Tag>
        <Tag 
          className="cursor-pointer hover:bg-[#58a6ff20]"
          onClick={() => {
            const updated = localFactors.map(f => ({
              ...f,
              weight: f.key.startsWith('macro') || f.key.startsWith('fed') || f.key.startsWith('vix')
                ? 35 : f.key.startsWith('industry')
                ? 25 : 20
            }))
            setLocalFactors(updated)
            onChange?.(updated)
          }}
        >
          宏观+行业优先
        </Tag>
      </div>

      {/* 因子分类折叠 */}
      <Collapse
        activeKey={collapsedKeys}
        onChange={(keys) => setCollapsedKeys(keys as string[])}
        ghost
        items={Object.entries(categoryConfig).map(([category, config]) => {
          const categoryFactors = getCategoryFactors(category)
          const total = calculateCategoryWeight(categoryFactors)
          const signal = calculateCategorySignal(categoryFactors)
          
          return {
            key: category,
            label: (
              <div className="flex items-center justify-between w-full pr-4">
                <Space>
                  <span>{config.icon}</span>
                  <span className="text-[#c9d1d9]">{config.label}</span>
                  <Badge 
                    count={categoryFactors.filter(f => f.signal === 'bullish').length}
                    style={{ backgroundColor: '#3fb950' }}
                    size="small"
                  />
                </Space>
                <Space>
                  <Tag 
                    style={{ 
                      backgroundColor: config.color + '20', 
                      borderColor: config.color,
                      color: config.color
                    }}
                    className="text-xs"
                  >
                    {total}%
                  </Tag>
                  <span 
                    className="text-xs"
                    style={{ color: getSignalColor(signal) }}
                  >
                    {getSignalIcon(signal)}
                  </span>
                </Space>
              </div>
            ),
            children: (
              <div className="space-y-3 pl-2">
                {categoryFactors.map(factor => (
                  <div key={factor.key} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <Space size="small">
                        <Text className="text-sm text-[#c9d1d9]">{factor.name}</Text>
                        {factor.description && (
                          <Tooltip title={factor.description}>
                            <InfoCircleOutlined className="text-[#8b949e] text-xs" />
                          </Tooltip>
                        )}
                      </Space>
                      
                      <Space size="small">
                        {/* 当前值显示 */}
                        {factor.value && factor.value !== '-' && (
                          <Tag className="text-xs bg-[#21262d] text-[#8b949e] border-0">
                            {typeof factor.value === 'number' ? factor.value.toFixed(2) : factor.value}
                          </Tag>
                        )}
                        
                        <InputNumber
                          size="small"
                          value={factor.weight}
                          min={0}
                          max={100}
                          onChange={(val) => updateWeight(factor.key, val || 0)}
                          className="w-16"
                          disabled={factor.locked}
                        />
                        <button
                          onClick={() => toggleLock(factor.key)}
                          className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
                        >
                          {factor.locked ? <LockOutlined /> : <UnlockOutlined />}
                        </button>
                      </Space>
                    </div>
                    
                    <Slider
                      value={factor.weight}
                      onChange={(val) => updateWeight(factor.key, val)}
                      disabled={factor.locked}
                      className="mb-0"
                      tooltip={{ formatter: (v) => `${v}%` }}
                    />
                  </div>
                ))}
              </div>
            )
          }
        })}
      />

      {/* 权重总和显示 */}
      <div className="mt-4 pt-4 border-t border-[#30363d]">
        <div className="flex items-center justify-between">
          <Text className="text-[#8b949e]">权重分配</Text>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-[#21262d] rounded-full overflow-hidden">
              <div 
                className="h-full transition-all"
                style={{ 
                  width: `${Math.min(100, totalWeight)}%`,
                  backgroundColor: totalWeight === 100 ? '#3fb950' : totalWeight > 100 ? '#f85149' : '#f0883e'
                }}
              />
            </div>
            <Text className={`text-xs ${totalWeight === 100 ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
              {totalWeight}%
            </Text>
          </div>
        </div>
      </div>

      {/* 因子说明 */}
      <div className="mt-4 text-xs text-[#8b949e] p-3 bg-[#0d1117] rounded-lg">
        <Text strong className="text-[#c9d1d9] block mb-2">因子说明</Text>
        <ul className="list-disc pl-4 space-y-1">
          <li>宏观因子：货币政策、汇率、通胀、地缘政治</li>
          <li>行业因子：行业趋势、上游价格、政策支持</li>
          <li>技术因子：均线、MACD、KDJ、RSI、布林带</li>
          <li>基本面因子：业绩增速、ROE、估值分位</li>
          <li>资金面因子：北向资金、融资融券、主力动向</li>
          <li>周期因子：美林时钟、季节性、行业周期</li>
          <li>事件驱动：财报日期、分红、政策事件</li>
        </ul>
      </div>
    </Card>
  )
}

export default FactorPanel