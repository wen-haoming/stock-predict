import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Input, Spin, Tag, Empty } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

const { Search } = Input

interface StockOption {
  code: string
  name: string
  market: 'A' | 'HK' | 'US'
  exchange?: string
}

interface StockSearchProps {
  /** 与顶栏 Segmented 同步，不再在组件内单独选市场 */
  market: 'A' | 'HK' | 'US'
  value?: string
  onChange?: (code: string) => void
  onSearch?: (code: string, market: 'A' | 'HK' | 'US') => void
  placeholder?: string
}

async function fetchSearchSuggestions(keyword: string, market: 'A' | 'HK' | 'US'): Promise<StockOption[]> {
  const q = encodeURIComponent(keyword)
  const res = await fetch(`/api/search?keyword=${q}&market=${market}`)
  if (!res.ok) throw new Error(`search ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

const SEARCH_DEBOUNCE_MS = 320

const StockSearch: React.FC<StockSearchProps> = ({
  market,
  value,
  onChange,
  onSearch,
  placeholder = '输入股票代码或名称搜索'
}) => {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<StockOption[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [lastQuery, setLastQuery] = useState('')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearDebounce = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }
  }

  useEffect(() => () => clearDebounce(), [])

  const runSearch = useCallback(
    async (keyword: string) => {
      const trimmed = keyword.trim()
      if (!trimmed) {
        setResults([])
        setLastQuery('')
        setShowDropdown(false)
        return
      }

      setLoading(true)
      setLastQuery(trimmed)
      try {
        const data = await fetchSearchSuggestions(trimmed, market)
        setResults(data)
        setShowDropdown(true)
      } catch (error) {
        console.error('搜索失败:', error)
        setResults([])
        setShowDropdown(true)
      } finally {
        setLoading(false)
      }
    },
    [market]
  )

  const queueSearch = useCallback(
    (keyword: string) => {
      clearDebounce()
      debounceTimer.current = setTimeout(() => {
        debounceTimer.current = null
        void runSearch(keyword)
      }, SEARCH_DEBOUNCE_MS)
    },
    [runSearch]
  )

  const searchNow = useCallback(
    (keyword: string) => {
      clearDebounce()
      void runSearch(keyword)
    },
    [runSearch]
  )

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }
    if (value?.trim()) {
      void runSearch(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅顶栏市场变化时刷新联想
  }, [market])

  const handleSelect = (code: string) => {
    const stock = results.find((s) => s.code === code)
    if (stock) {
      onChange?.(stock.code)
      onSearch?.(stock.code, market)
    }
    setShowDropdown(false)
  }

  const getMarketTagColor = (m: string) => {
    switch (m) {
      case 'A':
        return 'blue'
      case 'HK':
        return 'purple'
      case 'US':
        return 'cyan'
      default:
        return 'default'
    }
  }

  const showEmpty =
    showDropdown &&
    !loading &&
    results.length === 0 &&
    !!lastQuery &&
    lastQuery === (value || '').trim()

  return (
    <div className="relative min-w-[200px] max-w-md">
      <Search
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const v = e.target.value
          onChange?.(v)
          queueSearch(v)
        }}
        onSearch={(val) => {
          searchNow(val)
          onSearch?.(val.trim(), market)
        }}
        onFocus={() => {
          if (results.length > 0) setShowDropdown(true)
          if ((value || '').trim().length > 0) queueSearch(value || '')
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        loading={loading}
        allowClear
        enterButton={loading ? <Spin size="small" /> : <SearchOutlined />}
        className="w-full"
      />

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl overflow-hidden max-h-72 overflow-y-auto">
          {results.map((stock) => (
            <div
              key={`${stock.market}-${stock.code}`}
              className="px-4 py-3 hover:bg-[#21262d] cursor-pointer flex items-center justify-between border-b border-[#21262d] last:border-0 transition-colors"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(stock.code)}
            >
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <Tag color={getMarketTagColor(stock.market)} className="text-xs shrink-0">
                  {stock.market === 'A' ? 'A股' : stock.market === 'HK' ? '港股' : '美股'}
                </Tag>
                <span className="text-[#c9d1d9] font-medium shrink-0">{stock.code}</span>
                <span className="text-[#8b949e] truncate">{stock.name}</span>
              </div>
              <span className="text-[#58a6ff] text-xs shrink-0 ml-2">→</span>
            </div>
          ))}
        </div>
      )}

      {showEmpty && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-[#161b22] border border-[#30363d] rounded-lg p-4">
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
