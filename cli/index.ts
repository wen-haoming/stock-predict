import { Command } from 'commander'
import { analyzeStock } from '../src/ai/analyzer'
import { searchStock } from '../src/services'

const program = new Command()

// 主命令
program
  .name('stock-predict')
  .description('股票拐点预测工具 - 买入预期，卖出事实')
  .version('1.0.0')

// 分析股票命令
program
  .command('analyze')
  .description('分析单只股票')
  .argument('<code>', '股票代码 (如: 600519)')
  .option('-m, --market <market>', '市场类型 (A/HK/US)', 'A')
  .action(async (code, options) => {
    console.log(`\n📊 正在分析股票: ${code} (${options.market})\n`)
    
    const market = options.market as 'A' | 'HK' | 'US'
    const result = await analyzeStock(code, market)
    
    if (result) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`📈 当前趋势: ${result.trend}`)
      console.log(`🎯 当前阶段: ${result.phase}`)
      console.log(`💡 趋势理由: ${result.trendReason}`)
      console.log('')
      
      if (result.prediction.date) {
        console.log(`🎯 拐点预测`)
        console.log(`   日期: ${result.prediction.date}`)
        console.log(`   置信度: ${result.prediction.confidence}%`)
        console.log(`   理由: ${result.prediction.reason}`)
        console.log('')
      }
      
      console.log(`${result.suggestion.type === 'buy' ? '🟢 买入建议' : result.suggestion.type === 'sell' ? '🔴 卖出建议' : '🟡 持有建议'}`)
      if (result.suggestion.price) {
        console.log(`   价格: ${result.suggestion.price}`)
      }
      if (result.suggestion.date) {
        console.log(`   日期: ${result.suggestion.date}`)
      }
      console.log(`   理由: ${result.suggestion.reason}`)
      console.log('')
      
      if (result.riskFactors.length > 0) {
        console.log('⚠️ 风险提示:')
        result.riskFactors.forEach((risk, i) => {
          console.log(`   ${i + 1}. ${risk}`)
        })
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('\n✅ 分析完成\n')
    } else {
      console.log('❌ 分析失败，请检查股票代码或网络连接\n')
    }
  })

// 搜索股票命令
program
  .command('search')
  .description('搜索股票')
  .argument('<keyword>', '搜索关键词')
  .option('-m, --market <market>', '市场类型 (A/HK/US/all)', 'all')
  .action(async (keyword, options) => {
    console.log(`\n🔍 搜索: ${keyword}\n`)
    
    const results = await searchStock(keyword, options.market === 'all' ? undefined : options.market as any)
    
    if (results.length > 0) {
      console.log('找到以下股票:')
      console.log('')
      results.forEach((stock: any, i: number) => {
        console.log(`${i + 1}. [${stock.market}] ${stock.code} - ${stock.name}`)
      })
      console.log('')
    } else {
      console.log('未找到匹配的股票\n')
    }
  })

// 默认命令 - 等同于 analyze
program
  .command('stock <code>')
  .description('分析股票')
  .option('-m, --market <market>', '市场类型 (A/HK/US)', 'A')
  .action(async (code, options) => {
    const market = options.market as 'A' | 'HK' | 'US'
    const result = await analyzeStock(code, market)
    
    if (result) {
      console.log(`\n📈 ${result.trend} | ${result.phase}`)
      console.log(`${result.suggestion.type === 'buy' ? '🟢' : result.suggestion.type === 'sell' ? '🔴' : '🟡'} ${result.suggestion.reason}`)
      if (result.prediction.date) {
        console.log(`🎯 拐点预测: ${result.prediction.date} (置信度 ${result.prediction.confidence}%)`)
      }
    } else {
      console.log('\n❌ 分析失败')
    }
  })

// 导出为 OpenClaw skill 使用的函数
export async function openclawAnalyze(code: string, market: 'A' | 'HK' | 'US' = 'A'): Promise<string> {
  const result = await analyzeStock(code, market)
  
  if (!result) {
    return `❌ 无法分析股票 ${code}，请检查股票代码或网络连接。`
  }

  const emoji = result.suggestion.type === 'buy' ? '🟢' : result.suggestion.type === 'sell' ? '🔴' : '🟡'
  const status = result.phase === '预期阶段' ? '📈' : '📉'
  
  let response = `**${status} ${code} 分析结果**\n\n`
  response += `**趋势**: ${result.trend}\n`
  response += `**阶段**: ${result.phase}\n\n`
  
  if (result.prediction.date) {
    response += `🎯 **拐点预测**\n`
    response += `- 日期: ${result.prediction.date}\n`
    response += `- 置信度: ${result.prediction.confidence}%\n`
    response += `- 理由: ${result.prediction.reason}\n\n`
  }
  
  response += `${emoji} **建议**: ${result.suggestion.type.toUpperCase()}\n`
  response += `- ${result.suggestion.reason}\n`
  
  if (result.riskFactors.length > 0) {
    response += `\n⚠️ **风险**: ${result.riskFactors.join(', ')}`
  }
  
  return response
}

// 解析股票代码中的市场信息
export function parseStockCode(input: string): { code: string; market: 'A' | 'HK' | 'US' } {
  const upper = input.toUpperCase()
  
  // 美股 (字母为主)
  if (/^[A-Z]{1,5}$/.test(upper) && !/^\d+$/.test(upper)) {
    return { code: upper, market: 'US' }
  }
  
  // 港股 (5位数)
  if (/^\d{5}$/.test(input)) {
    return { code: input, market: 'HK' }
  }
  
  // A股 (6位数)
  if (/^\d{6}$/.test(input)) {
    return { code: input, market: 'A' }
  }
  
  // 默认 A 股
  return { code: input.replace(/\D/g, ''), market: 'A' }
}

program.parse()