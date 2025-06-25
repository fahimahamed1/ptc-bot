const { readDb, writeDb, ensureUser, getCurrency, getMinPayout } = require('../../db/db');

module.exports = function setupPayout(bot) {
  bot.command('payout', async (ctx) => {
    try {
      const db = readDb();
      const userId = String(ctx.from.id);
      const user = db.users[userId] ?? ensureUser(userId);
      const minPayout = getMinPayout();

      if (user.balance < minPayout) {
        return await ctx.reply(
          `❌ Minimum payout is ${minPayout} ${getCurrency()}. Your balance: ${user.balance}`
        );
      }

      if (db.payouts.find((p) => p.userId === userId)) {
        return await ctx.reply('⚠️ You already have a pending payout request.');
      }

      const payout = {
        id: `payout_${Date.now()}`,
        userId,
        amount: user.balance,
      };

      db.payouts.push(payout);
      user.balance = 0;
      db.users[userId] = user;
      writeDb(db);

      return await ctx.reply(
        `✅ Payout request sent for ${payout.amount} ${getCurrency()}. Admin will review it soon.`
      );
    } catch (err) {
      console.error('Error in /payout:', err);
      return ctx.reply('❌ Something went wrong while processing your payout.');
    }
  });
};