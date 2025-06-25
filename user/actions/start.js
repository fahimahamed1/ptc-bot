const { readDb, writeDb, getCurrency, ensureUser, addReferral } = require('../../database/db');

module.exports = function setupStart(bot) {
  bot.start(async (ctx) => {
    try {
      const userId = String(ctx.from.id);
      const db = readDb();
      const user = ensureUser(userId);

      const name = ctx.from.first_name || 'Friend';

      const args = ctx.message?.text?.split(' ') || [];
      const refId = args[1];

      if (refId && !user.referrer && refId !== userId) {
        ensureUser(refId);
        user.referrer = refId;
        addReferral(db, refId, db.refBonus || 10);
        writeDb(db);
        await ctx.reply(`🎉 Nice! Your referrer earned ${db.refBonus || 10} ${getCurrency()} coins.`);
      }

      await ctx.reply(
        `Hi ${name}! Welcome to the PTC Bot.\n\n` +
        `Use these commands:\n` +
        `/ads - View ads & earn\n` +
        `/balance - Check balance\n` +
        `/payout - Withdraw coins\n` +
        `/referral - Invite friends\n` +
        `/help - Get help anytime\n\n` +
        `Let’s get earning! 💰`
      );
    } catch {
      await ctx.reply('Oops! Something went wrong. Please try again later.');
    }
  });
};