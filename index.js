// ptc_bot.js
require('dotenv').config();
require('dotenv').config();
const { Telegraf, Markup, session } = require('telegraf');
const fs = require('fs');
const path = require('path');
const express = require('express');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_IDS = process.env.ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || [];
const MIN_PAYOUT = 9;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN not found in .env');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

// === JSON DB Path and Default Data ===
const dbPath = path.join(__dirname, 'ptc-db.json');

function getDefaultDb() {
  return {
    users: {},
    ads: [],
    payouts: [],
    confirmedPayouts: [],
    refBonus: 10,
    currency: '🪙'
  };
}

function readDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      const def = getDefaultDb();
      fs.writeFileSync(dbPath, JSON.stringify(def, null, 2));
      return def;
    }
    const data = JSON.parse(fs.readFileSync(dbPath));
    const def = getDefaultDb();
    for (const key of Object.keys(def)) {
      if (!(key in data)) data[key] = def[key];
    }
    return data;
  } catch (err) {
    console.error('Error reading DB:', err);
    return getDefaultDb();
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

function getCurrency() {
  return readDb().currency || '🪙';
}

function isAdmin(ctx) {
  return ctx.from && ADMIN_IDS.includes(Number(ctx.from.id));
}

function ensureUser(id) {
  const db = readDb();
  if (!db.users[id]) {
    db.users[id] = {
      id,
      balance: 0,
      referrals: 0,
      referralEarnings: 0,
      referrer: null,
      watched: {}
    };
    writeDb(db);
  }
  return db.users[id];
}

function addReferral(referrerId, bonus) {
  const db = readDb();
  if (db.users[referrerId]) {
    db.users[referrerId].balance += bonus;
    db.users[referrerId].referralEarnings += bonus;
    db.users[referrerId].referrals += 1;
    writeDb(db);
  }
}

// === Session Middleware ===
bot.use(async (ctx, next) => {
  ctx.session ??= {};
  await next();
});

// === Commands ===
bot.start(async (ctx) => {
  const userId = String(ctx.from.id);
  const user = ensureUser(userId);
  const ref = ctx.message?.text?.split(' ')[1];

  if (ref && !user.referrer && ref !== userId) {
    ensureUser(ref);
    user.referrer = ref;
    addReferral(ref, readDb().refBonus || 10);
    writeDb(readDb());
    await ctx.reply(`🎉 Referral registered! Your referrer earned ${readDb().refBonus} ${getCurrency()}`);
  }

  await ctx.reply(`👋 Welcome to the PTC Bot!

/ads — View and earn
/balance — Your coins
/payout — Withdraw
/referral — Invite & earn`);
});

bot.command('ads', async (ctx) => {
  const db = readDb();
  const userId = String(ctx.from.id);
  const user = db.users[userId] ?? ensureUser(userId);

  if (db.ads.length === 0) {
    return ctx.reply('📭 No ads available.');
  }

  for (const ad of db.ads) {
    const watched = user.watched?.[ad.id];

    await ctx.reply(
      `🔗 ${ad.url}\n💰 Reward: ${ad.reward} ${getCurrency()}\nStatus: ${watched ? '✅ Watched' : '❌ Not watched'}`,
      Markup.inlineKeyboard([
        watched
          ? Markup.button.callback('✅ Watched', 'noop', true) // disabled button
          : Markup.button.callback('✅ I Watched', `watched_${ad.id}`)
      ])
    );
  }
});

bot.action(/^watched_(.+)$/, async (ctx) => {
  const adId = ctx.match[1];
  const userId = String(ctx.from.id);
  const db = readDb();

  const ad = db.ads.find(a => a.id === adId);
  if (!ad) return ctx.answerCbQuery('Ad not found');

  const user = db.users[userId] ?? ensureUser(userId);
  if (user.watched[adId]) return ctx.answerCbQuery('Already claimed');

  user.balance += ad.reward;
  user.watched[adId] = true;
  db.users[userId] = user;

  writeDb(db);

  await ctx.reply(`✅ You earned ${ad.reward} ${getCurrency()}`);
  ctx.answerCbQuery();
});

// Handle no-op button clicks gracefully
bot.action('noop', (ctx) => ctx.answerCbQuery());

bot.command('balance', (ctx) => {
  const user = ensureUser(String(ctx.from.id));
  ctx.reply(`💰 Balance: ${user.balance} ${getCurrency()}
👁 Watched Ads: ${Object.keys(user.watched).length}
👥 Referrals: ${user.referrals}
🎁 Referral Earnings: ${user.referralEarnings} ${getCurrency()}`);
});

bot.command('payout', (ctx) => {
  const db = readDb();
  const userId = String(ctx.from.id);
  const user = db.users[userId] ?? ensureUser(userId);

  if (user.balance < MIN_PAYOUT) {
    return ctx.reply(`❌ Minimum payout is ${MIN_PAYOUT} ${getCurrency()}. Your balance: ${user.balance}`);
  }

  if (db.payouts.find(p => p.userId === userId)) {
    return ctx.reply('⚠️ You already have a pending payout request.');
  }

  const payout = {
    id: `payout_${Date.now()}`,
    userId,
    amount: user.balance
  };

  db.payouts.push(payout);
  user.balance = 0;          // Reset balance here in DB object
  db.users[userId] = user;   // Save updated user in DB

  writeDb(db);               // Save DB with updated balance

  ctx.reply(`✅ Payout request sent for ${payout.amount} ${getCurrency()}. Admin will review it soon.`);
});

bot.command('referral', (ctx) => {
  const user = ensureUser(String(ctx.from.id));
  ctx.reply(`👥 Referrals: ${user.referrals}
🎁 Referral Earnings: ${user.referralEarnings} ${getCurrency()}

🔗 Invite link:
https://t.me/${ctx.me}?start=${ctx.from.id}`);
});


// === Admin Panel ===
bot.command('admin', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.reply('🛠 Admin Panel', Markup.inlineKeyboard([
    [Markup.button.callback('➕ Add Ad', 'add_ad')],
    [Markup.button.callback('📃 List Ads', 'list_ads')],
    [Markup.button.callback('❌ Delete Ad', 'delete_ad')],
    [Markup.button.callback('💸 Payouts', 'admin_payout')],
    [Markup.button.callback('🎁 Set Ref Bonus', 'set_ref_bonus')],
    [Markup.button.callback('💱 Set Currency', 'set_currency')],
    [Markup.button.callback('📊 Stats', 'state_panel')]
  ]));
});

// === Admin Actions ===
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
    ctx.reply(`🧾 Payout Request:
User: ${req.userId}
Amount: ${req.amount} ${getCurrency()}`,
      Markup.inlineKeyboard([
        Markup.button.callback('✅ Mark Paid', `paid_${req.id}`),
        Markup.button.callback('❌ Ignore & Refund', `ignore_${req.id}`)
      ]));
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
  const payoutId = ctx.match[1];
  const db = readDb();
  const payoutReq = db.payouts.find(p => p.id === payoutId);
  if (!payoutReq) return ctx.answerCbQuery('Not found');

  // Refund balance to user in the db object
  if (db.users[payoutReq.userId]) {
    db.users[payoutReq.userId].balance += payoutReq.amount;
  }

  // Remove payout request
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
🎁 Ref Earnings: ${totalRefEarn} ${getCurrency()}
💳 Paid: ${paid} ${getCurrency()}
🎯 Referral Bonus: ${db.refBonus || 0} ${getCurrency()}
💱 Currency: ${getCurrency()}`);
  ctx.answerCbQuery();
});

// === Admin Input Handling ===
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

  next();
});

// === Web Server ===
const app = express();
app.get('/', (_, res) => res.send('✅ PTC Bot is running'));
app.listen(PORT, () => console.log(`🌐 Server on port ${PORT}`));

// === Launch Bot ===
bot.launch()
  .then(() => console.log('🤖 Bot launched'))
  .catch(err => {
    console.error('❌ Bot launch failed:', err);
    process.exit(1);
  });
