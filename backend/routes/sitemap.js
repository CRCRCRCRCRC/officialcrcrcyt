const express = require('express');
const router = express.Router();
const database = require('../config/database');

// 生成 sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = (process.env.FRONTEND_URL || process.env.SITE_URL || 'https://officialcrcrc.vercel.app')
      .trim()
      .replace(/\/+$/, '');
    const currentDate = new Date().toISOString().split('T')[0];

    // 靜態頁面
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/announcements', priority: '0.8', changefreq: 'daily' },
      { url: '/leaderboard', priority: '0.8', changefreq: 'daily' },
      { url: '/lyrics', priority: '0.9', changefreq: 'daily' },
      { url: '/lyrics/soramimi', priority: '0.9', changefreq: 'daily' },
      { url: '/lyrics/lyrics', priority: '0.9', changefreq: 'daily' },
    ];

    // 獲取所有演唱者
    const artistsResult = await database.pool.query(`
      SELECT DISTINCT a.slug as artist_slug, l.category, MAX(l.updated_at) as last_modified
      FROM artists a
      INNER JOIN lyrics l ON a.id = l.artist_id
      GROUP BY a.slug, l.category
      ORDER BY last_modified DESC
    `);

    // 獲取所有歌詞
    const lyricsResult = await database.pool.query(`
      SELECT
        l.slug as song_slug,
        l.category,
        l.updated_at,
        a.slug as artist_slug
      FROM lyrics l
      INNER JOIN artists a ON l.artist_id = a.id
      ORDER BY l.updated_at DESC
    `);

    // 獲取所有公告
    const announcementsResult = await database.pool.query(`
      SELECT id, updated_at
      FROM announcements
      WHERE is_published = true
      ORDER BY updated_at DESC
    `);

    // 生成 XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // 添加靜態頁面
    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // 添加演唱者頁面
    artistsResult.rows.forEach(artist => {
      const lastMod = artist.last_modified ? new Date(artist.last_modified).toISOString().split('T')[0] : currentDate;
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/lyrics/${artist.category}/${artist.artist_slug}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    });

    // 添加歌詞頁面
    lyricsResult.rows.forEach(lyric => {
      const lastMod = lyric.updated_at ? new Date(lyric.updated_at).toISOString().split('T')[0] : currentDate;
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/lyrics/${lyric.category}/${lyric.artist_slug}/${lyric.song_slug}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    // 添加公告頁面
    announcementsResult.rows.forEach(announcement => {
      const lastMod = announcement.updated_at ? new Date(announcement.updated_at).toISOString().split('T')[0] : currentDate;
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/announcements/${announcement.id}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('生成 sitemap 失敗:', error);
    res.status(500).send('生成 sitemap 失敗');
  }
});

module.exports = router;
