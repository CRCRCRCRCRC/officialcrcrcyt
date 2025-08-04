const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, process.env.DB_PATH || '../database/crcrc.db');

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('資料庫連接失敗:', err.message);
          reject(err);
        } else {
          console.log('✅ 已連接到 SQLite 資料庫');
          this.initTables().then(resolve).catch(reject);
        }
      });
    });
  }

  initTables() {
    return new Promise((resolve, reject) => {
      const queries = [
        // 用戶表
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'admin',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // 影片表
        `CREATE TABLE IF NOT EXISTS videos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          youtube_id TEXT UNIQUE NOT NULL,
          thumbnail_url TEXT,
          duration TEXT,
          view_count INTEGER DEFAULT 0,
          published_at DATETIME,
          is_featured BOOLEAN DEFAULT 0,
          tags TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // 頻道資訊表
        `CREATE TABLE IF NOT EXISTS channel_info (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          channel_name TEXT NOT NULL,
          description TEXT,
          subscriber_count INTEGER DEFAULT 0,
          total_views INTEGER DEFAULT 0,
          youtube_url TEXT,
          discord_url TEXT,
          minecraft_discord_url TEXT,
          banner_image TEXT,
          avatar_image TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // 網站設置表
        `CREATE TABLE IF NOT EXISTS site_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      ];

      let completed = 0;
      queries.forEach((query, index) => {
        this.db.run(query, (err) => {
          if (err) {
            console.error(`表創建失敗 (${index}):`, err.message);
            reject(err);
          } else {
            completed++;
            if (completed === queries.length) {
              console.log('✅ 資料庫表初始化完成');
              resolve();
            }
          }
        });
      });
    });
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('關閉資料庫時發生錯誤:', err.message);
          } else {
            console.log('✅ 資料庫連接已關閉');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new Database();