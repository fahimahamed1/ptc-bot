// bot/admin.js
const { Markup } = require('telegraf');
const {
  readDb,
  writeDb,
  getCurrency,
  isAdmin,
} = require('../db/db');

module.exports = function setupAdminPanel(bot) {
  bot.command('admin', (ctx) => {
    if (!isAdmin(ctx)) return;
    const db = readDb();
    ctx.reply(
      '🛠 Admin Panel',
      Markup.inlineKeyboard([
        [Markup.button.callback('➕ Add Ad', 'add_ad')],
        [Markup.button.callback('📃 List Ads', 'list_ads')],
        [Markup.button.callback('❌ Delete Ad', 'delete_ad')],
        [Markup.button.callback('💸 Payouts', 'admin_payout')],
        [Markup.button.callback('🎁 Set Ref Bonus', 'set_ref_bonus')],
        [Markup.button.callback('💱 Set Currency', 'set_currency')],
        [Markup.button.callback('🎯 Set Min Payout', 'set_min_payout')], // new button
        [Markup.button.callback('📊 Stats', 'state_panel')],
      ])
    );
  });

  bot.action('add_ad', (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();
    ctx.session.awaitingAd = true;
    ctx.reply('✏️ Send new ad as: id|url|reward\nExample:\nad123|https://example.com|15');
    ctx.answerCbQuery();
  });

  bot.action('set_ref_bonus', (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();
    ctx.session.awaitingBonus = true;
    ctx.reply('🎁 Send new referral bonus amount (number):');
    ctx.answerCbQuery();
  });

  bot.action('set_currency', (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();
    ctx.session.awaitingCurrency = true;
    ctx.reply('💱 Send new currency symbol (e.g. 🪙, $, ₹):');
    ctx.answerCbQuery();
  });

  bot.action('set_min_payout', (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();
    ctx.session.awaitingMinPayout = true;
    ctx.reply('🎯 Send new minimum payout amount (number):');
    ctx.answerCbQuery();
  });

  bot.action('list_ads', (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();
    const db = readDb();
    if (db.ads.length === 0) return ctx.reply('📭 No ads available.');
    let msg = '📃 Ads List:\n';
    db.ads.forEach(ad => {
      msg += `ID: ${ad.id} | URL: ${ad.url} | Reward: ${ad.reward} ${getCurrency()}\n`;
    });
    ctx.reply(msg);
    ctx.answerCbQuery();
  });

  bot.action('delete_ad', (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();
    const db = readDb();
    if (db.ads.length === 0) return ctx.reply('📭 No ads available.');
    const buttons = db.ads.map(ad => [Markup.button.callback(ad.id, `del_${ad.id}`)]);
    ctx.reply('🗑 Choose ad to delete:', Markup.inlineKeyboard(buttons));
    ctx.answerCbQuery();
  });

  bot.action(/^del_(.+)$/, (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();
    const adId = ctx.match[1];
    const db = readDb();
    const beforeCount = db.ads.length;
    db.ads = db.ads.filter(ad => ad.id !== adId);
    writeDb(db);
    if (db.ads.length === beforeCount) {
      ctx.answerCbQuery('Ad not found.', { show_alert: true });
    } else {
      ctx.reply(`✅ Deleted ad: ${adId}`);
      ctx.answerCbQuery();
    }
  });

  bot.action('admin_payout', (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();
    const db = readDb();
    if (db.payouts.length === 0) return ctx.reply('📭 No payout requests.');
    db.payouts.forEach(req => {
      ctx.reply(
        `🧾 Payout Request:
User: ${req.userId}
Amount: ${req.amount} ${getCurrency()}`,
        Markup.inlineKeyboard([
          Markup.button.callback('✅ Mark Paid', `paid_${req.id}`),
          Markup.button.callback('❌ Ignore & Refund', `ignore_${req.id}`),
        ])
      );
    });
    ctx.answerCbQuery();
  });

  bot.action(/^paid_(.+)$/, (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();
    const id = ctx.match[1];
    const db = readDb();
    const req = db.payouts.find(p => p.id === id);
    if (!req) return ctx.answerCbQuery('Request not found.');
    db.payouts = db.payouts.filter(p => p.id !== id);
    db.confirmedPayouts = db.confirmedPayouts || [];
    db.confirmedPayouts.push(req);
    writeDb(db);
    ctx.telegram.sendMessage(req.userId, `✅ Your payout of ${req.amount} ${getCurrency()} was confirmed by admin.`);
    ctx.editMessageText('✅ Marked as paid.');
  });

  bot.action(/^ignore_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();
    const payoutId = ctx.match[1];
    const db = readDb();
    const payoutReq = db.payouts.find(p => p.id === payoutId);
    if (!payoutReq) return ctx.answerCbQuery('Not found');

    if (db.users[payoutReq.userId]) {
      db.users[payoutReq.userId].balance += payoutReq.amount;
    }

    db.payouts = db.payouts.filter(p => p.id !== payoutId);
    writeDb(db);

    try {
      await ctx.telegram.sendMessage(payoutReq.userId, `⚠️ Your payout request was ignored and refunded ${payoutReq.amount} ${getCurrency()}.`);
    } catch {}

    await ctx.editMessageText('❌ Ignored and refunded.');
    await ctx.answerCbQuery();
  });

  bot.action('state_panel', (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();
    const db = readDb();
    const confirmedPayouts = Array.isArray(db.confirmedPayouts) ? db.confirmedPayouts : [];
    const totalUsers = Object.keys(db.users || {}).length;
    const totalAds = (db.ads || []).length;
    const totalPayouts = (db.payouts || []).length;
    const confirmed = confirmedPayouts.length;
    const paid = confirmedPayouts.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalBal = Object.values(db.users || {}).reduce((sum, u) => sum + (u.balance || 0), 0);
    const totalRefEarn = Object.values(db.users || {}).reduce((sum, u) => sum + (u.referralEarnings || 0), 0);

    ctx.reply(`📊 Bot Stats:

👥 Users: ${totalUsers}
📺 Ads: ${totalAds}
💸 Pending Payouts: ${totalPayouts}
✅ Confirmed Payouts: ${confirmed}
💰 Total Balances: ${totalBal} ${getCurrency()}
🎁 Referral Earnings: ${totalRefEarn} ${getCurrency()}
💳 Paid Out: ${paid} ${getCurrency()}
🎯 Referral Bonus: ${db.refBonus || 0} ${getCurrency()}
🎯 Min Payout: ${db.minPayout || 9} ${getCurrency()}
💱 Currency: ${getCurrency()}`);
    ctx.answerCbQuery();
  });

  // Admin input text (ad/ref bonus/currency/minPayout)
  bot.on('text', (ctx, next) => {
    if (!isAdmin(ctx)) return next();

    const db = readDb();
    ctx.session ??= {};

    if (ctx.session.awaitingAd) {
      const [id, url, rewardRaw] = ctx.message.text.split('|');
      const reward = parseInt(rewardRaw);
      if (!id || !url || isNaN(reward) || reward <= 0) {
        return ctx.reply('❌ Invalid ad format. Use: id|url|reward');
      }
      if (db.ads.find(a => a.id === id)) {
        return ctx.reply('❌ Ad ID already exists.');
      }
      db.ads.push({ id, url, reward });
      writeDb(db);
      ctx.session.awaitingAd = false;
      return ctx.reply('✅ Ad added.');
    }

    if (ctx.session.awaitingBonus) {
      const bonus = parseInt(ctx.message.text);
      if (isNaN(bonus)) return ctx.reply('❌ Invalid bonus amount.');
      db.refBonus = bonus;
      writeDb(db);
      ctx.session.awaitingBonus = false;
      return ctx.reply(`🎁 Referral bonus set to ${bonus} ${getCurrency()}`);
    }

    if (ctx.session.awaitingCurrency) {
      const symbol = ctx.message.text.trim();
      db.currency = symbol;
      writeDb(db);
      ctx.session.awaitingCurrency = false;
      return ctx.reply(`💱 Currency symbol updated to: ${symbol}`);
    }

    if (ctx.session.awaitingMinPayout) {
      const minPayout = parseInt(ctx.message.text);
      if (isNaN(minPayout) || minPayout <= 0) {
        return ctx.reply('❌ Invalid minimum payout amount.');
      }
      db.minPayout = minPayout;
      writeDb(db);
      ctx.session.awaitingMinPayout = false;
      return ctx.reply(`🎯 Minimum payout updated to ${minPayout} ${getCurrency()}`);
    }

    next();
  });
};