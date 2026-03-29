import React, { useState, useCallback } from 'react'
import { Input, Select, Spin, Space, Tag, Empty } from 'antd'
import { SearchOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { searchStock } from '../../services'

const { Search } = Input

interface StockOption {
  code: string
  name: string
  market: 'A' | 'HK' | 'US'
  exchange?: string
}

interface StockSearchProps {
  value?: string
  onChange?: (code: string, market: 'A' | 'HK' | 'US') => void
  onSearch?: (code: string, market: 'A' | 'HK' | 'US') => void
  placeholder?: string
}

const marketOptions = [
  { value: 'A', label: 'A股' },
  { value: 'HK', label: '港股' },
  { value: 'US', label: '美股' }
]

const StockSearch: React.FC<StockSearchProps> = ({ 
  value, 
  onChange, 
  onSearch,
  placeholder = '输入股票代码或名称搜索' 
}) => {
  const [market, setMarket] = useState<'A' | 'HK' | 'US'>('A')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<StockOption[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  const handleSearch = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const data = await searchStock(keyword, market)
      setResults(data)
      setShowDropdown(true)
    } catch (error) {
      console.error('搜索失败:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [market])

  const handleSelect = (code: string) => {
    const stock = results.find(s => s.code === code)
    if (stock) {
      onChange?.(stock.code, stock.market)
      onSearch?.(stock.code, stock.market)
    }
    setShowDropdown(false)
  }

  const getMarketTagColor = (m: string) => {
    switch (m) {
      case 'A': return 'blue'
      case 'HK': return 'purple'
      case 'US': return 'cyan'
      default: return 'default'
    }
  }

  return (
    <div className="relative">
      <Space.Compact className="w-full">
        <Select
          value={market}
          onChange={(val) => setMarket(val as 'A' | 'HK' | 'US')}
          options={marketOptions}
          className="w-24"
          popupClassName="dark-select"
        />
        <Search
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value, market)}
          onSearch={(val) => {
            handleSearch(val)
            onSearch?.(val, market)
          }}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          loading={loading}
          allowClear
          enterButton={
            loading ? <Spin size="small" /> : <SearchOutlined />
          }
          className="flex-1"
        />
      </Space.Compact>

      {/* 下拉结果 */}
      {showDropdown && results.length > 0 && (
        <div 
          className="absolute z-50 w-full mt-1 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl overflow-hidden"
        >
          {results.map((stock) => (
            <div
              key={`${stock.market}-${stock.code}`}
              className="px-4 py-3 hover:bg-[#21262d] cursor-pointer flex items-center justify-between border-b border-[#21262d] last:border-0 transition-colors"
              onClick={() => handleSelect(stock.code)}
            >
              <div className="flex items-center gap-2">
                <Tag color={getMarketTagColor(stock.market)} className="text-xs">
                  {stock.market === 'A' ? 'A股' : stock.market === 'HK' ? '港股' : '美股'}
                </Tag>
                <span className="text-[#c9d1d9] font-medium">{stock.code}</span>
                <span className="text-[#8b949e]">{stock.name}</span>
              </div>
              <span className="text-[#58a6ff] text-xs">→</span>
            </div>
          ))}
        </div>
      )}

      {/* 无结果 */}
      {showDropdown && !loading && results.length === 0 && value && (
        <div className="absolute z-50 w-full mt-1 bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <Empty 
            description={<span className="text-[#8b949e]">未找到相关股票</span>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      )}
    </div>
  )
}

export default StockSearch