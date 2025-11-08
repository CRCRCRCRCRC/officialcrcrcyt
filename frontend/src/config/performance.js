// 性能優化配置

// 快速動畫配置（減少到原來的 1/3）
export const FAST_ANIMATION = {
  duration: 0.1, // 原 0.3
  ease: 'easeOut'
}

export const INSTANT_ANIMATION = {
  duration: 0.05, // 幾乎瞬間
  ease: 'easeOut'
}

// Framer Motion 變體 - 快速版本
export const fadeInVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.1 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.05 }
  }
}

export const slideInVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15 }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.1 }
  }
}

// 列表項目動畫 - 移除 stagger
export const listItemVariants = {
  initial: { opacity: 0, y: 5 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.1 }
  }
}

// 圖片懶加載配置
export const LAZY_LOAD_CONFIG = {
  threshold: 0.1,
  rootMargin: '50px'
}

// API 請求配置
export const API_CONFIG = {
  timeout: 10000, // 10秒超時
  retry: 1, // 只重試一次
  cache: true // 啟用緩存
}
