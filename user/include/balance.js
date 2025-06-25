const { ensureUser, getCurrency } = require('../../db/db');

module.exports = function setupBalance(bot) {
  bot.command('balance', (ctx) => {
    try {
      const user = ensureUser(String(ctx.from.id));
      ctx.reply(`💰 Balance: ${user.balance} ${getCurrency()}
👁 Watched Ads: ${Object.keys(user.watched).length}
👥 Referrals: ${user.referrals}
🎁 Referral Earnings: ${user.referralEarnings} ${getCurrency()}`);
    } catch (err) {
      console.error('Error in /balance:', err);
    }
  });
};