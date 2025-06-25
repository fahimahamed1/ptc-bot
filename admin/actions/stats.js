const { isAdmin, readDb, getCurrency } = require('../../database/db');

module.exports = (bot) => {
  bot.action('state_panel', (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();

    const db = readDb();
    const users = db.users || {};
    const ads = db.ads || [];
    const payouts = db.payouts || [];
    const confirmedPayouts = db.confirmedPayouts || [];

    const totalUsers = Object.keys(users).length;
    const totalAds = ads.length;
    const totalPayouts = payouts.length;
    const confirmed = confirmedPayouts.length;
    const paid = confirmedPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalBalance = Object.values(users).reduce((sum, u) => sum + (u.balance || 0), 0);
    const totalReferral = Object.values(users).reduce((sum, u) => sum + (u.referralEarnings || 0), 0);

    ctx.reply(`📊 Bot Stats:

👥 Users: ${totalUsers}
📺 Ads: ${totalAds}
💸 Pending Payouts: ${totalPayouts}
✅ Confirmed Payouts: ${confirmed}
💳 Paid Out: ${paid} ${getCurrency()}
💰 Total Balances: ${totalBalance} ${getCurrency()}
🎁 Referral Earnings: ${totalReferral} ${getCurrency()}
🎯 Referral Bonus: ${db.refBonus || 0} ${getCurrency()}
🎯 Min Payout: ${db.minPayout || 0} ${getCurrency()}
💱 Currency: ${getCurrency()}`);

    ctx.answerCbQuery();
  });
};