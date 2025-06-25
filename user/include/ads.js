const { Markup } = require('telegraf');
const { readDb, writeDb, ensureUser, getCurrency } = require('../../db/db');


module.exports = function setupAds(bot) {
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

  // no-op button for already watched
  bot.action('noop', (ctx) => ctx.answerCbQuery());
};