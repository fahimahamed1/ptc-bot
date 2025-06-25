const { ensureUser, getCurrency } = require('../../db/db');

module.exports = function setupReferral(bot) {
  bot.command('referral', (ctx) => {
    try {
      const user = ensureUser(String(ctx.from.id));
      ctx.reply(`👥 Referrals: ${user.referrals}
🎁 Referral Earnings: ${user.referralEarnings} ${getCurrency()}

🔗 Invite your friends with this link:
https://t.me/${ctx.me}?start=${ctx.from.id}`);
    } catch (err) {
      console.error('Error in /referral:', err);
    }
  });
};