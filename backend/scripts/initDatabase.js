const bcrypt = require('bcryptjs');
const database = require('../config/database');
require('dotenv').config();

async function initDatabase() {
  try {
    console.log('🔄 開始初始化資料庫...');
    
    // 連接資料庫
    await database.connect();

    // 檢查是否已有管理員用戶
    const existingUsers = await database.query('SELECT * FROM users');
    
    if (existingUsers.length === 0) {
      console.log('📝 創建默認管理員用戶...');
      
      // 創建默認管理員
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
      await database.run(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [process.env.ADMIN_USERNAME || 'admin', hashedPassword, 'admin']
      );
      
      console.log('✅ 默認管理員用戶創建成功');
      console.log(`   用戶名: ${process.env.ADMIN_USERNAME || 'admin'}`);
      console.log(`   密碼: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    } else {
      console.log('ℹ️  管理員用戶已存在，跳過創建');
    }

    // 檢查是否已有頻道資訊
    const existingChannelInfo = await database.query('SELECT * FROM channel_info');
    
    if (existingChannelInfo.length === 0) {
      console.log('📝 創建默認頻道資訊...');
      
      await database.run(
        `INSERT INTO channel_info (
          channel_name, description, youtube_url, discord_url, minecraft_discord_url,
          subscriber_count, total_views
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'CRCRC',
'創作空耳與荒野亂鬥內容的頻道，歡迎訂閱，一起玩音樂玩遊戲！',
          'https://youtube.com/@officialcrcrcyt',
          'https://discord.gg/FyrNaF6Nbj',
          'https://discord.gg/9jBCTheX3Y',
          0,
          0
        ]
      );
      
      console.log('✅ 默認頻道資訊創建成功');
    } else {
      console.log('ℹ️  頻道資訊已存在，跳過創建');
    }

    // 跳過示例影片創建，讓管理員添加真實影片
    const existingVideos = await database.query('SELECT * FROM videos');
    
    if (existingVideos.length === 0) {
      console.log('ℹ️  資料庫為空，請在管理後台添加真實影片');
    } else {
      console.log('ℹ️  影片數據已存在，跳過創建');
    }

    // 添加默認網站設置
    const existingSettings = await database.query('SELECT * FROM site_settings');
    
    if (existingSettings.length === 0) {
      console.log('📝 創建默認網站設置...');
      
      const defaultSettings = [
        { key: 'site_title', value: 'CRCRC 官方網站', description: '網站標題' },
        { key: 'site_description', value: '創作空耳與荒野亂鬥內容的頻道，歡迎訂閱，一起玩音樂玩遊戲！', description: '網站描述' },
        { key: 'contact_email', value: 'contact@crcrc.com', description: '聯絡信箱' },
        { key: 'featured_video_count', value: '6', description: '首頁精選影片數量' },
        { key: 'youtube_channel_id', value: 'UCLG-31GRtc0JQ7o1GZDofHA', description: 'YouTube 頻道 ID' }
      ];

      for (const setting of defaultSettings) {
        await database.run(
          'INSERT INTO site_settings (key, value, description) VALUES (?, ?, ?)',
          [setting.key, setting.value, setting.description]
        );
      }
      
      console.log('✅ 默認網站設置創建成功');
    } else {
      console.log('ℹ️  網站設置已存在，跳過創建');
    }

    console.log('🎉 資料庫初始化完成！');
    console.log('');
    console.log('📋 登入資訊:');
    console.log(`   管理後台: http://localhost:3001/admin`);
    console.log(`   用戶名: ${process.env.ADMIN_USERNAME || 'admin'}`);
    console.log(`   密碼: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log('');
    console.log('🚀 現在可以啟動服務器: npm run dev');

  } catch (error) {
    console.error('❌ 資料庫初始化失敗:', error);
  } finally {
    await database.close();
    process.exit(0);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;