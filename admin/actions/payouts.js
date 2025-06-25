const { Markup } = require('telegraf');
const { isAdmin, readDb, writeDb, getCurrency } = require('../../database/db');

module.exports = (bot) => {
  bot.action('admin_payout', (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();

    const db = readDb();
    if (!db.payouts || db.payouts.length === 0) {
      return ctx.reply('📭 No payout requests.');
    }

    db.payouts.forEach(req => {
      ctx.reply(
        `🧾 Payout Request:\n👤 User: ${req.userId}\n💰 Amount: ${req.amount} ${getCurrency()}`,
        Markup.inlineKeyboard([
          Markup.button.callback('✅ Mark Paid', `paid_${req.id}`),
          Markup.button.callback('❌ Ignore & Refund', `ignore_${req.id}`)
        ])
      );
    });

    ctx.answerCbQuery();
  });

  bot.action(/^paid_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();

    const id = ctx.match[1];
    const db = readDb();
    const req = db.payouts.find(p => p.id === id);
    if (!req) return ctx.answerCbQuery('Request not found.');

    db.payouts = db.payouts.filter(p => p.id !== id);
    db.confirmedPayouts = db.confirmedPayouts || [];
    db.confirmedPayouts.push(req);
    writeDb(db);

    await ctx.telegram.sendMessage(req.userId, `✅ Your payout of ${req.amount} ${getCurrency()} was confirmed by admin.`);
    await ctx.editMessageText('✅ Marked as paid.');
    ctx.answerCbQuery();
  });

  bot.action(/^ignore_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();

    const id = ctx.match[1];
    const db = readDb();
    const req = db.payouts.find(p => p.id === id);
    if (!req) return ctx.answerCbQuery('Not found');

    if (db.users[req.userId]) {
      db.users[req.userId].balance += req.amount;
    }

    db.payouts = db.payouts.filter(p => p.id !== id);
    writeDb(db);

    try {
      await ctx.telegram.sendMessage(req.userId, `⚠️ Your payout request was ignored and refunded ${req.amount} ${getCurrency()}.`);
    } catch {}

    await ctx.editMessageText('❌ Ignored and refunded.');
    ctx.answerCbQuery();
  });
};