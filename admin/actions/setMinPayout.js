const { isAdmin, readDb, writeDb, getCurrency } = require('../../db/db');

module.exports = (bot) => {
  bot.action('set_min_payout', (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();
    ctx.session.awaitingMinPayout = true;
    ctx.reply('🎯 Send new minimum payout amount (number):');
    ctx.answerCbQuery();
  });

  bot.on('text', (ctx, next) => {
    if (!isAdmin(ctx)) return next();
    if (!ctx.session.awaitingMinPayout) return next();

    const minPayout = parseInt(ctx.message.text);
    if (isNaN(minPayout) || minPayout <= 0) {
      return ctx.reply('❌ Invalid minimum payout amount.');
    }

    const db = readDb();
    db.minPayout = minPayout;
    writeDb(db);

    ctx.session.awaitingMinPayout = false;
    ctx.reply(`🎯 Minimum payout updated to ${minPayout} ${getCurrency()}`);
  });
};