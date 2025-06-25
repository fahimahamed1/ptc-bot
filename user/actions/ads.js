const { Markup } = require('telegraf');
const { readDb, writeDb, ensureUser, getCurrency } = require('../../database/db');

module.exports = function setupAds(bot) {
  bot.command('ads', async (ctx) => {
    try {
      const db = readDb();
      const userId = String(ctx.from.id);
      const user = db.users[userId] ?? ensureUser(userId);

      if (db.ads.length === 0) {
        return ctx.reply('📭 No ads available right now.');
      }

      for (const ad of db.ads) {
        const watched = user.watched?.[ad.id];
        const button = watched
          ? Markup.button.callback('✅ Watched', 'noop', true)
          : Markup.button.callback('▶️ I Watched This', `watched_${ad.id}`);

        await ctx.reply(
          `📢 *Advertisement*\n\n🔗 [Visit Ad](${ad.url})\n💰 *Reward:* ${ad.reward} ${getCurrency()}\n📌 *Status:* ${watched ? '✅ Watched' : '❌ Not Watched'}`,
          {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            ...Markup.inlineKeyboard([[button]])
          }
        );
      }
    } catch (err) {
      console.error('Error in /ads:', err);
      ctx.reply('❌ Failed to load ads.');
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

      await ctx.reply(`✅ Congrats! You earned *${ad.reward} ${getCurrency()}*!`, { parse_mode: 'Markdown' });
      ctx.answerCbQuery();
    } catch (err) {
      console.error('Error in watched action:', err);
      ctx.answerCbQuery('❌ Something went wrong.');
    }
  });

  bot.action('noop', (ctx) => ctx.answerCbQuery());
};
