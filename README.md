# Stock Predict - 股票拐点预测工具

基于时间线的股票拐点预测工具，结合宏观因子（美联储、地缘政治）、行业因子（上游价格、行业趋势）、基本面（业绩、财务）和技术面，预测股票拐点并给出买入/卖出建议。

## 核心原则

> **买入的是预期，卖出的是事实**

## 功能特性

- 📊 支持 A股、港股、美股
- 📈 技术面分析（均线、MACD、KDJ、RSI、布林带）
- 🌐 宏观因子（Fed政策、汇率、CPI、PMI、地缘政治）
- 💰 资金面因子（北向资金、融资融券、主力动向）
- 🏭 行业因子（行业趋势、上游价格、行业政策）
- 🔄 周期因子（美林时钟、季节性效应）
- 📅 事件驱动（财报日期、政策事件）
- 📉 基本面（业绩预告、财报日期）
- 🎯 AI 智能拐点预测
- ⏰ Timeline 可视化
- 💻 Web 应用（Express + React）

## 技术栈

- **前端**: React 18 + Antd 5 + Tailwind CSS
- **后端**: Express + TypeScript
- **数据库**: SQLite (better-sqlite3)
- **图表**: Lightweight Charts
- **AI**: MiniMax 2.7 (可选)

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境

```bash
cp .env.example .env
# 编辑 .env，填入你的 MiniMax API Key
```

### 启动开发服务器

```bash
npm run dev
```

- 前端: http://localhost:5173
- 后端 API: http://localhost:3000

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
stock-predict/
├── server/           # Express 后端服务
│   └── index.ts     # API 路由
├── src/
│   ├── renderer/   # React 前端
│   │   ├── components/  # UI 组件
│   │   └── App.tsx      # 主应用
│   ├── services/   # 数据服务（东财/港股/美股）
│   ├── factors/    # 多因子库
│   │   ├── technical.ts  # 技术因子
│   │   ├── macro.ts      # 宏观因子
│   │   ├── fund.ts       # 资金面因子
│   │   ├── cycle.ts      # 周期因子
│   │   └── event.ts      # 事件驱动
│   └── ai/         # AI 分析
├── dist/           # 构建输出
└── package.json
```

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/stock/:code` | GET | 获取股票行情和K线 |
| `/api/analyze` | POST | AI 分析股票 |
| `/api/search` | GET | 搜索股票 |
| `/api/factors` | GET | 获取宏观/资金/周期数据 |

## 多因子体系

| 类别 | 权重 | 因子 |
|------|------|------|
| 技术因子 | 20% | MA、MACD、KDJ、RSI、布林带 |
| 宏观因子 | 20% | Fed利率、LPR、汇率、CPI、PMI |
| 资金因子 | 15% | 北向资金、融资融券、主力 |
| 行业因子 | 15% | 趋势、上游价格、政策 |
| 基本面 | 15% | 业绩、ROE、估值 |
| 周期因子 | 10% | 美林时钟、季节性 |
| 事件驱动 | 5% | 财报日期、政策 |

## OpenClaw Skill

将 `openclaw-skill/` 目录放到 OpenClaw 的 skills 目录下即可使用。

## 免责声明

本工具仅供参考，不构成投资建议。股市有风险，投资需谨慎。