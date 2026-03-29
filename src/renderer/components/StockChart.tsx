import React, { useEffect, useRef, useState } from 'react'
import { Card, Space, Tag, Spin, Select, Empty } from 'antd'
import { AreaChartOutlined } from '@ant-design/icons'
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData } from 'lightweight-charts'

interface StockChartProps {
  stockCode: string
  klineData?: any[]
  loading?: boolean
}

const periodOptions = [
  { value: 'day', label: '日K' },
  { value: 'week', label: '周K' },
  { value: 'month', label: '月K' }
]

const StockChart: React.FC<StockChartProps> = ({ stockCode, klineData, loading }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const ma5SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ma10SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const [period, setPeriod] = useState('day')

  useEffect(() => {
    if (!containerRef.current) return

    // 创建图表
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#0d1117' },
        textColor: '#8b949e'
      },
      grid: {
        vertLines: { color: '#21262d' },
        horzLines: { color: '#21262d' }
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#58a6ff',
          width: 1,
          style: 2,
          labelBackgroundColor: '#58a6ff'
        },
        horzLine: {
          color: '#58a6ff',
          width: 1,
          style: 2,
          labelBackgroundColor: '#58a6ff'
        }
      },
      timeScale: {
        borderColor: '#30363d',
        timeVisible: true
      },
      rightPriceScale: {
        borderColor: '#30363d'
      }
    })

    // 蜡烛图系列
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#3fb950',
      downColor: '#f85149',
      borderUpColor: '#3fb950',
      borderDownColor: '#f85149',
      wickUpColor: '#3fb950',
      wickDownColor: '#f85149'
    })

    // 均线系列
    const ma5Series = chart.addLineSeries({
      color: '#f0883e',
      lineWidth: 1,
      title: 'MA5'
    })

    const ma10Series = chart.addLineSeries({
      color: '#58a6ff',
      lineWidth: 1,
      title: 'MA10'
    })

    const ma20Series = chart.addLineSeries({
      color: '#a371f7',
      lineWidth: 1,
      title: 'MA20'
    })

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries
    ma5SeriesRef.current = ma5Series
    ma10SeriesRef.current = ma10Series
    ma20SeriesRef.current = ma20Series

    // 响应式
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth
        })
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  // 更新数据
  useEffect(() => {
    if (!klineData || klineData.length === 0 || !candlestickSeriesRef.current) return

    // 转换数据
    const candleData: CandlestickData[] = klineData.map(item => ({
      time: item.date as any,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close
    }))

    candlestickSeriesRef.current.setData(candleData)

    // 计算均线
    const closes = klineData.map(item => item.close)
    
    const calculateMA = (period: number) => {
      const data: LineData[] = []
      for (let i = period - 1; i < closes.length; i++) {
        const sum = closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
        data.push({
          time: klineData[i].date as any,
          value: sum / period
        })
      }
      return data
    }

    ma5SeriesRef.current?.setData(calculateMA(5))
    ma10SeriesRef.current?.setData(calculateMA(10))
    ma20SeriesRef.current?.setData(calculateMA(20))

    // 自适应
    chartRef.current?.timeScale().fitContent()
  }, [klineData])

  const hasKline = Boolean(klineData && klineData.length > 0)

  return (
    <Card 
      className="bg-[#161b22] border-[#30363d]"
      title={
        <Space>
          <AreaChartOutlined className="text-[#58a6ff]" />
          <span className="text-[#c9d1d9]">K线图</span>
          {stockCode && <Tag color="blue">{stockCode}</Tag>}
        </Space>
      }
      extra={
        <Select
          value={period}
          onChange={setPeriod}
          options={periodOptions}
          size="small"
          className="w-20"
          popupClassName="dark-select"
        />
      }
    >
      <div ref={containerRef} className="h-80 w-full bg-[#0d1117] rounded-lg relative">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-[#0d1117]/80">
            <Spin tip="加载中..." />
          </div>
        )}
        {!loading && !hasKline && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-[#0d1117]/95 border border-dashed border-[#30363d]">
            <Empty description={<span className="text-[#8b949e]">暂无 K 线数据（请确认后端与行情源可用）</span>} />
          </div>
        )}
      </div>
      
      {/* 图例 */}
      <div className="flex items-center gap-4 mt-3 text-xs">
        <Space size="middle">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#f0883e] rounded-sm"></span>
            MA5
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#58a6ff] rounded-sm"></span>
            MA10
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#a371f7] rounded-sm"></span>
            MA20
          </span>
        </Space>
      </div>
    </Card>
  )
}

export default StockChart