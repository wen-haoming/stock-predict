import dotenv from 'dotenv'
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

function stripBom(content: string): string {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content
}

/** 从目录向上查找含 package.json 的仓库根（支持子目录启动、符号链接等） */
export function findPackageRoot(startDir: string): string {
  let dir = startDir
  for (let i = 0; i < 12; i++) {
    if (existsSync(join(dir, 'package.json'))) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return startDir
}

function applyParsed(parsed: Record<string, string>, override: boolean) {
  for (const [key, raw] of Object.entries(parsed)) {
    const k = key.trim()
    const v = typeof raw === 'string' ? raw.trim() : raw
    if (!k) continue
    if (override || process.env[k] === undefined || process.env[k] === '') {
      process.env[k] = v
    }
  }
}

function loadEnvFile(path: string, override: boolean) {
  if (!existsSync(path)) return
  try {
    const raw = stripBom(readFileSync(path, 'utf8'))
    const parsed = dotenv.parse(raw)
    applyParsed(parsed, override)
  } catch (e) {
    console.error(`[env] 无法读取 ${path}:`, e)
  }
}

/**
 * 从当前模块 URL 与 process.cwd() 两侧推断仓库根，加载 .env / .env.local
 * （不依赖「必须从项目根启动」，并避免 UTF-8 BOM 导致变量名异常）
 */
export function loadProjectEnv(importMetaUrl: string) {
  const fromFile = findPackageRoot(dirname(fileURLToPath(importMetaUrl)))
  const fromCwd = findPackageRoot(process.cwd())
  const roots = Array.from(new Set([fromFile, fromCwd]))

  for (const root of roots) {
    loadEnvFile(join(root, '.env'), false)
    loadEnvFile(join(root, '.env.local'), true)
  }
}

export function maskApiKeyPreview(): string {
  const k = (
    process.env.MINIMAX_API_KEY ||
    process.env.AI_API_KEY ||
    process.env.ANALYSIS_API_KEY ||
    ''
  ).trim()
  if (!k) return '未检测到（请检查 .env 是否在仓库根且已重启后端）'
  if (k.length <= 10) return `${k.slice(0, 2)}…（长度异常短，请确认未截断）`
  return `${k.slice(0, 7)}…${k.slice(-4)}（已就绪）`
}
