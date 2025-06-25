const { isAdmin, readDb, getCurrency } = require('../../database/db');

module.exports = (bot) => {
  bot.action('list_ads', (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();

    const db = readDb();
    if (!db.ads || db.ads.length === 0) {
      return ctx.reply('📭 No ads available.');
    }

    let msg = '📃 Ads List:\n\n';
    db.ads.forEach(ad => {
      msg += `🆔 ID: ${ad.id}\n🔗 URL: ${ad.url}\n🎯 Reward: ${ad.reward} ${getCurrency()}\n\n`;
    });

    ctx.reply(msg);
    ctx.answerCbQuery();
  });
};