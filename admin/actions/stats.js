const { isAdmin, readDb, getCurrency } = require('../../database/db');

module.exports = (bot) => {
  bot.action('state_panel', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();

    const db = readDb();
    const users = db.users || {};
    const ads = db.ads || [];
    const payouts = db.payouts || [];
    const confirmedPayouts = db.confirmedPayouts || [];

    const totalUsers = Object.keys(users).length;
    const totalAds = ads.length;
    const pendingPayouts = payouts.length;
    const confirmedCount = confirmedPayouts.length;
    const totalPaid = confirmedPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalUserBalance = Object.values(users).reduce((sum, u) => sum + (u.balance || 0), 0);
    const totalReferralEarnings = Object.values(users).reduce((sum, u) => sum + (u.referralEarnings || 0), 0);

    const statsMessage = `
📊 *Bot Statistics*

👥 Total Users: *${totalUsers}*
📺 Total Ads: *${totalAds}*

💸 Pending Payouts: *${pendingPayouts}*
✅ Confirmed Payouts: *${confirmedCount}*
💳 Total Paid Out: *${totalPaid} ${getCurrency()}*

💰 Total User Balances: *${totalUserBalance} ${getCurrency()}*
🎁 Referral Earnings: *${totalReferralEarnings} ${getCurrency()}*

🎯 Referral Bonus: *${db.refBonus || 0} ${getCurrency()}*
💵 Min Payout: *${db.minPayout || 0} ${getCurrency()}*
💱 Currency: *${getCurrency()}*
    `.trim();

    await ctx.reply(statsMessage, { parse_mode: 'Markdown' });
    ctx.answerCbQuery();
  });
};