const { readDb, writeDb, getCurrency, ensureUser, addReferral } = require('../../db/db');

module.exports = function setupStart(bot) {
  bot.start(async (ctx) => {
    try {
      const userId = String(ctx.from.id);
      const db = readDb();
      const user = ensureUser(userId);
      const ref = ctx.message?.text?.split(' ')[1];

      if (ref && !user.referrer && ref !== userId) {
        ensureUser(ref);
        user.referrer = ref;
        addReferral(db, ref, db.refBonus || 10);
        writeDb(db);
        await ctx.reply(`🎉 Referral registered! Your referrer earned ${db.refBonus} ${getCurrency()}`);
      }

      await ctx.reply(`👋 Welcome to the PTC Bot!

/ads — View and earn coins
/balance — Check your balance
/payout — Withdraw your coins
/referral — Invite friends & earn bonuses
`);
    } catch (err) {
      console.error('Error in /start:', err);
    }
  });
};