const { isAdmin, readDb, writeDb } = require('../../database/db');

module.exports = (bot) => {
  bot.action('set_currency', (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();
    ctx.session.awaitingCurrency = true;
    ctx.reply('💱 Send new currency symbol (e.g. $, 🪙, ₹):');
    ctx.answerCbQuery();
  });

  bot.on('text', (ctx, next) => {
    if (!isAdmin(ctx)) return next();
    if (!ctx.session.awaitingCurrency) return next();

    const symbol = ctx.message.text.trim();
    const db = readDb();
    db.currency = symbol;
    writeDb(db);

    ctx.session.awaitingCurrency = false;
    ctx.reply(`💱 Currency symbol updated to: ${symbol}`);
  });
};