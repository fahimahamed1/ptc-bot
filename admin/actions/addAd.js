const { Markup } = require('telegraf');
const { isAdmin, readDb, writeDb } = require('../../db/db');

module.exports = (bot) => {
  bot.action('add_ad', (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();
    ctx.session.awaitingAd = true;
    ctx.reply('✏️ Send new ad as:\n`id|url|reward`\nExample:\n`ad123|https://example.com|15`', { parse_mode: 'Markdown' });
    ctx.answerCbQuery();
  });

  bot.on('text', (ctx, next) => {
    if (!isAdmin(ctx)) return next();
    if (!ctx.session.awaitingAd) return next();

    const db = readDb();
    const [id, url, rewardRaw] = ctx.message.text.split('|');
    const reward = parseInt(rewardRaw);

    if (!id || !url || isNaN(reward) || reward <= 0) {
      return ctx.reply('❌ Invalid ad format. Use: id|url|reward');
    }

    if (db.ads.find(a => a.id === id)) {
      return ctx.reply('❌ Ad ID already exists.');
    }

    db.ads.push({ id, url, reward });
    writeDb(db);
    ctx.session.awaitingAd = false;
    ctx.reply('✅ Ad added.');
  });
};