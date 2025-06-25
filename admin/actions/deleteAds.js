const { Markup } = require('telegraf');
const { isAdmin, readDb, writeDb } = require('../../database/db');

module.exports = (bot) => {
  bot.action('delete_ad', (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();

    const db = readDb();
    if (!db.ads || db.ads.length === 0) {
      return ctx.reply('📭 No ads to delete.');
    }

    const buttons = db.ads.map(ad => [Markup.button.callback(ad.id, `del_${ad.id}`)]);
    ctx.reply('🗑 Choose ad to delete:', Markup.inlineKeyboard(buttons));
    ctx.answerCbQuery();
  });

  bot.action(/^del_(.+)$/, (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();

    const adId = ctx.match[1];
    const db = readDb();
    const before = db.ads.length;

    db.ads = db.ads.filter(ad => ad.id !== adId);
    writeDb(db);

    if (db.ads.length === before) {
      return ctx.answerCbQuery('Ad not found.', { show_alert: true });
    }

    ctx.reply(`✅ Deleted ad: ${adId}`);
    ctx.answerCbQuery();
  });
};