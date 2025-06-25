const { Markup } = require('telegraf');
const {
  readDb,
  writeDb,
  getCurrency,
  getMinPayout,
  ensureUser,
  addReferral,
} = require('../db/db');

module.exports = function setupBotCommands(bot) {
  // /start — welcome and register referral if present
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

  // /ads — show ads with watch buttons and watched status
  bot.command('ads', async (ctx) => {
    try {
      const db = readDb();
      const userId = String(ctx.from.id);
      const user = db.users[userId] ?? ensureUser(userId);

      if (db.ads.length === 0) return ctx.reply('📭 No ads available right now.');

      for (const ad of db.ads) {
        const watched = user.watched?.[ad.id];
        await ctx.reply(
          `🔗 ${ad.url}\n💰 Reward: ${ad.reward} ${getCurrency()}\nStatus: ${watched ? '✅ Watched' : '❌ Not watched'}`,
          Markup.inlineKeyboard([
            watched
              ? Markup.button.callback('✅ Watched', 'noop', true)
              : Markup.button.callback('✅ I Watched', `watched_${ad.id}`),
          ])
        );
      }
    } catch (err) {
      console.error('Error in /ads:', err);
    }
  });

  // User confirms watching ad
  bot.action(/^watched_(.+)$/, async (ctx) => {
    try {
      const adId = ctx.match[1];
      const userId = String(ctx.from.id);
      const db = readDb();

      const ad = db.ads.find(a => a.id === adId);
      if (!ad) return ctx.answerCbQuery('Ad not found.');

      const user = db.users[userId] ?? ensureUser(userId);
      if (user.watched[adId]) return ctx.answerCbQuery('You already claimed this ad.');

      user.balance += ad.reward;
      user.watched[adId] = true;
      db.users[userId] = user;

      writeDb(db);

      await ctx.reply(`✅ Congrats! You earned ${ad.reward} ${getCurrency()}.`);
      ctx.answerCbQuery();
    } catch (err) {
      console.error('Error in watched action:', err);
      ctx.answerCbQuery('❌ Something went wrong.');
    }
  });

  // No-op button
  bot.action('noop', (ctx) => ctx.answerCbQuery());

  // /balance
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

  // /payout
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

  // /referral
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