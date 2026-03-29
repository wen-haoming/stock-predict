// IndexedDB 数据库模块（Web 版本）

const DB_NAME = 'stock_predict_db'
const DB_VERSION = 1

interface StockData {
  code: string
  market: string
  name?: string
  addedAt: string
}

interface PredictionData {
  id?: number
  code: string
  market: string
  trend: string
  phase: string
  predictionDate?: string
  confidence?: number
  suggestionType: string
  suggestionPrice?: string
  createdAt: string
}

interface FactorData {
  key: string
  category: string
  weight: number
  locked: boolean
}

interface CacheData {
  code: string
  market: string
  price: number
  change: number
  changePercent: number
  updatedAt: string
}

// 数据库连接
let db: IDBDatabase | null = null

/**
 * 打开 IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // 股票收藏
      if (!database.objectStoreNames.contains('watchlist')) {
        const watchlistStore = database.createObjectStore('watchlist', { keyPath: ['code', 'market'] })
        watchlistStore.createIndex('addedAt', 'addedAt', { unique: false })
      }

      // 预测记录
      if (!database.objectStoreNames.contains('predictions')) {
        const predictionsStore = database.createObjectStore('predictions', { keyPath: 'id', autoIncrement: true })
        predictionsStore.createIndex('code', 'code', { unique: false })
        predictionsStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      // 因子权重
      if (!database.objectStoreNames.contains('factors')) {
        database.createObjectStore('factors', { keyPath: 'key' })
      }

      // 行情缓存
      if (!database.objectStoreNames.contains('priceCache')) {
        const cacheStore = database.createObjectStore('priceCache', { keyPath: ['code', 'market'] })
        cacheStore.createIndex('updatedAt', 'updatedAt', { unique: false })
      }

      // 设置
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'key' })
      }
    }
  })
}

/**
 * 通用的 CRUD 操作
 */
async function getAll<T>(storeName: string): Promise<T[]> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function get<T>(storeName: string, key: any): Promise<T | undefined> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(key)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function put(storeName: string, data: any): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(data)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function remove(storeName: string, key: any): Promise<void> {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(key)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// 股票收藏
export const watchlist = {
  async add(code: string, market: string, name?: string): Promise<void> {
    await put('watchlist', { code, market, name, addedAt: new Date().toISOString() })
  },

  async remove(code: string, market: string): Promise<void> {
    await remove('watchlist', [code, market])
  },

  async getAll(): Promise<StockData[]> {
    const items = await getAll<StockData>('watchlist')
    return items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
  }
}

// 预测记录
export const predictions = {
  async add(prediction: Omit<PredictionData, 'id'>): Promise<void> {
    await put('predictions', { ...prediction, createdAt: new Date().toISOString() })
  },

  async getByCode(code: string, market: string): Promise<PredictionData[]> {
    const all = await getAll<PredictionData>('predictions')
    return all.filter(p => p.code === code && p.market === market)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  },

  async getRecent(limit: number = 20): Promise<PredictionData[]> {
    const items = await getAll<PredictionData>('predictions')
    return items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  }
}

// 因子权重
export const factorWeights = {
  async getAll(): Promise<FactorData[]> {
    const items = await getAll<FactorData>('factors')
    if (items.length === 0) {
      // 返回默认因子
      const defaults = getDefaultFactors()
      for (const f of defaults) {
        await put('factors', f)
      }
      return defaults
    }
    return items
  },

  async update(key: string, weight: number, locked?: boolean): Promise<void> {
    const existing = await get<FactorData>('factors', key)
    if (existing) {
      await put('factors', { ...existing, weight, locked: locked ?? existing.locked })
    }
  },

  async updateMany(factors: FactorData[]): Promise<void> {
    for (const f of factors) {
      await put('factors', f)
    }
  }
}

// 行情缓存
export const priceCache = {
  async update(code: string, market: string, price: number, change: number, changePercent: number): Promise<void> {
    await put('priceCache', {
      code,
      market,
      price,
      change,
      changePercent,
      updatedAt: new Date().toISOString()
    })
  },

  async get(code: string, market: string): Promise<CacheData | null> {
    const cached = await get<CacheData>('priceCache', [code, market])
    if (cached) {
      // 5分钟缓存
      const updated = new Date(cached.updatedAt).getTime()
      if (Date.now() - updated < 5 * 60 * 1000) {
        return cached
      }
    }
    return null
  },

  async clear(): Promise<void> {
    const database = await openDB()
    const transaction = database.transaction('priceCache', 'readwrite')
    const store = transaction.objectStore('priceCache')
    store.clear()
  }
}

// 设置
export const settings = {
  async get<T>(key: string): Promise<T | undefined> {
    const result = await get<{ key: string; value: T }>('settings', key)
    return result?.value
  },

  async set<T>(key: string, value: T): Promise<void> {
    await put('settings', { key, value })
  }
}

// 关闭数据库
export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}

// 默认因子
function getDefaultFactors(): FactorData[] {
  return [
    // 宏观因子
    { key: 'fed_policy', category: 'macro', weight: 30, locked: false },
    { key: 'exchange', category: 'macro', weight: 25, locked: false },
    { key: 'cpi', category: 'macro', weight: 15, locked: false },
    { key: 'geopolitical', category: 'macro', weight: 20, locked: false },
    { key: 'vix', category: 'macro', weight: 10, locked: false },
    
    // 技术因子
    { key: 'ma_trend', category: 'technical', weight: 25, locked: false },
    { key: 'macd', category: 'technical', weight: 25, locked: false },
    { key: 'kdj', category: 'technical', weight: 20, locked: false },
    { key: 'rsi', category: 'technical', weight: 15, locked: false },
    { key: 'boll', category: 'technical', weight: 15, locked: false },
    
    // 资金因子
    { key: 'northbound', category: 'fund', weight: 30, locked: false },
    { key: 'margin', category: 'fund', weight: 25, locked: false },
    { key: 'super_large', category: 'fund', weight: 20, locked: false },
    { key: 'volume', category: 'fund', weight: 25, locked: false },
    
    // 行业因子
    { key: 'industry_trend', category: 'industry', weight: 30, locked: false },
    { key: 'upstream_prices', category: 'industry', weight: 25, locked: false },
    { key: 'industry_policy', category: 'industry', weight: 25, locked: false },
    { key: 'competition', category: 'industry', weight: 20, locked: false },
    
    // 基本面因子
    { key: 'earnings', category: 'financial', weight: 30, locked: false },
    { key: 'roe', category: 'financial', weight: 25, locked: false },
    { key: 'pe', category: 'financial', weight: 25, locked: false },
    { key: 'cash_flow', category: 'financial', weight: 20, locked: false },
    
    // 周期因子
    { key: 'clock_stage', category: 'cycle', weight: 50, locked: false },
    { key: 'seasonal', category: 'cycle', weight: 30, locked: false },
    { key: 'industry_cycle', category: 'cycle', weight: 20, locked: false },
    
    // 事件因子
    { key: 'annual_report', category: 'event', weight: 35, locked: false },
    { key: 'dividend', category: 'event', weight: 20, locked: false },
    { key: 'policy', category: 'event', weight: 25, locked: false },
    { key: 'corporate', category: 'event', weight: 20, locked: false }
  ]
}

export default {
  watchlist,
  predictions,
  factorWeights,
  priceCache,
  settings,
  closeDb
}