import type { EventData, EventFactor } from '../factors/event'

export interface TimelineItemDTO {
  id: string
  date: string
  type: 'fact' | 'expectation' | 'pivot' | 'report'
  title: string
  description?: string
  status?: string
  impact?: 'positive' | 'negative' | 'neutral'
}

function mapImpact(s?: EventFactor['impact']): TimelineItemDTO['impact'] | undefined {
  return s
}

function mapEventType(t: EventFactor['type']): TimelineItemDTO['type'] {
  if (t === 'report') return 'report'
  if (t === 'policy') return 'expectation'
  return 'fact'
}

function mapStatus(s?: EventFactor['status']): string | undefined {
  if (s === 'pending') return '待发布'
  if (s === 'confirmed') return '已确认'
  if (s === 'expired') return '已过期'
  return undefined
}

/** 将 getEventData 结果转为时间线（来自东财规则/披露日历等逻辑，非前端写死 mock） */
export function buildTimelineFromEventData(data: EventData): TimelineItemDTO[] {
  const all: EventFactor[] = [...data.reports, ...data.dividends, ...data.corporate, ...data.policies]
  return all
    .filter((ev) => Boolean(ev.date))
    .map((ev, i) => ({
      id: `${i}-${ev.type}-${ev.name}-${ev.date}`.replace(/\s+/g, ''),
      date: ev.date!,
      type: mapEventType(ev.type),
      title: ev.name,
      description: ev.description,
      status: mapStatus(ev.status),
      impact: mapImpact(ev.impact)
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
