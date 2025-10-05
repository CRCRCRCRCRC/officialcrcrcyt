// 安全渲染工具函數
export const safeRender = (value) => {
  // 如果是 null 或 undefined，返回空字符串
  if (value === null || value === undefined) {
    return ''
  }
  
  // 如果是字符串、數字或布爾值，直接返回
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }
  
  // 如果是數組，遞歸處理每個元素並用逗號連接
  if (Array.isArray(value)) {
    return value.map(safeRender).join(', ')
  }
  
  // 如果是普通對象，檢查是否包含 code 和 message 屬性（這可能是錯誤對象）
  if (typeof value === 'object' && value !== null) {
    // 特殊處理包含 code 和 message 的對象
    if ('code' in value && 'message' in value) {
      return `錯誤: ${value.message} (代碼: ${value.code})`
    }
    
    // 對於其他對象，返回其 JSON 字符串表示
    try {
      return JSON.stringify(value, null, 2)
    } catch (error) {
      return '[無法序列化的對象]'
    }
  }
  
  // 其他情況，返回空字符串
  return ''
}

// 檢查值是否可以安全渲染
export const isRenderable = (value) => {
  if (value === null || value === undefined) {
    return true
  }
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true
  }
  
  if (Array.isArray(value)) {
    return value.every(isRenderable)
  }
  
  return false
}