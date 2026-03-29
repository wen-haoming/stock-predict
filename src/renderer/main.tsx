import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import App from './App'
import './styles/index.css'

// 深色主题配置
const darkTheme = {
  token: {
    colorPrimary: '#58a6ff',
    colorBgContainer: '#161b22',
    colorBgElevated: '#21262d',
    colorBgLayout: '#0d1117',
    colorText: '#c9d1d9',
    colorTextSecondary: '#8b949e',
    colorBorder: '#30363d',
    borderRadius: 8
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider theme={darkTheme}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
)