const fs = require('fs');

try {
  console.log('🔍 嘗試讀取 Vercel 日誌...\n');
  
  // 嘗試不同的編碼方式
  const encodings = ['utf8', 'latin1', 'ascii'];
  
  for (const encoding of encodings) {
    try {
      console.log(`嘗試使用 ${encoding} 編碼...`);
      const content = fs.readFileSync('vercel_logs.txt', encoding);
      console.log(`✅ 成功使用 ${encoding} 編碼讀取`);
      console.log(`文件長度: ${content.length} 字符`);
      console.log('\n--- 日誌內容 ---');
      console.log(content.substring(0, 2000)); // 顯示前2000字符
      if (content.length > 2000) {
        console.log('\n... (內容被截斷) ...');
      }
      break;
    } catch (err) {
      console.log(`❌ ${encoding} 編碼失敗: ${err.message}`);
    }
  }
} catch (error) {
  console.error('❌ 讀取日誌文件失敗:', error.message);
}