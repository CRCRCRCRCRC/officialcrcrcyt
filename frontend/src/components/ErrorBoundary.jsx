import { Component } from 'react'
import { Link } from 'react-router-dom'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染可以顯示降级 UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // 你同樣可以將錯誤日誌上報到服務器
    console.error('ErrorBoundary 捕獲到錯誤:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      // 檢查是否是 React 錯誤 #31 (Objects are not valid as a React child)
      if (this.state.error?.message?.includes('Objects are not valid as a React child') ||
          this.state.error?.message?.includes('Minified React error #31')) {
        // 顯示更友好的錯誤信息
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 space-y-4">
              <h2 className="text-xl font-bold text-red-600">發生錯誤</h2>
              <p className="text-gray-700">
                我們在渲染組件時遇到了一個問題。這通常是因為某個組件嘗試渲染一個對象而不是有效的 React 元素。
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  錯誤信息: {this.state.error?.message || '未知錯誤'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => {
                    // 清除本地存儲並重新加載頁面
                    localStorage.clear()
                    window.location.href = '/'
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  清除緩存並重新加載
                </button>
                <Link
                  to="/"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-center"
                >
                  返回首頁
                </Link>
              </div>
            </div>
          </div>
        )
      }

      // 其他錯誤的通用處理
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-red-600">發生錯誤</h2>
            <p className="text-gray-700">
              應用程序遇到了一個意外錯誤。
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">
                錯誤信息: {this.state.error?.message || '未知錯誤'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                重新加載頁面
              </button>
              <Link
                to="/"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-center"
              >
                返回首頁
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary