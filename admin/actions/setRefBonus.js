const { isAdmin, readDb, writeDb, getCurrency } = require('../../db/db');

module.exports = (bot) => {
  bot.action('set_ref_bonus', (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();
    ctx.session.awaitingBonus = true;
    ctx.reply('🎁 Send new referral bonus amount (number):');
    ctx.answerCbQuery();
  });

  bot.on('text', (ctx, next) => {
    if (!isAdmin(ctx)) return next();
    if (!ctx.session.awaitingBonus) return next();

    const bonus = parseInt(ctx.message.text);
    if (isNaN(bonus)) return ctx.reply('❌ Invalid bonus amount.');

    const db = readDb();
    db.refBonus = bonus;
    writeDb(db);

    ctx.session.awaitingBonus = false;
    ctx.reply(`🎁 Referral bonus set to ${bonus} ${getCurrency()}`);
  });
};