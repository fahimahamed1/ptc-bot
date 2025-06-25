const { Markup } = require('telegraf');
const { isAdmin, readDb, writeDb, getCurrency } = require('../../database/db');

module.exports = (bot) => {
  // Show payout requests
  bot.action('admin_payout', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();

    const db = readDb();
    const requests = db.payouts || [];

    if (requests.length === 0) {
      return ctx.reply('📭 No payout requests at the moment.');
    }

    for (const req of requests) {
      await ctx.reply(
        `🧾 *Payout Request*\n\n👤 User ID: \`${req.userId}\`\n💳 Method: ${req.method}\n🔢 Account: ${req.account}\n💰 Amount: *${req.amount} ${getCurrency()}*`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            Markup.button.callback('✅ Mark Paid', `paid_${req.id}`),
            Markup.button.callback('❌ Ignore & Refund', `ignore_${req.id}`)
          ])
        }
      );
    }

    ctx.answerCbQuery();
  });

  // Mark as paid
  bot.action(/^paid_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();

    const id = ctx.match[1];
    const db = readDb();
    const index = db.payouts.findIndex(p => p.id === id);
    if (index === -1) return ctx.answerCbQuery('❌ Request not found.');

    const req = db.payouts.splice(index, 1)[0];
    db.confirmedPayouts = db.confirmedPayouts || [];
    db.confirmedPayouts.push(req);
    writeDb(db);

    try {
      await ctx.telegram.sendMessage(
        req.userId,
        `✅ Your payout of *${req.amount} ${getCurrency()}* has been *confirmed* by admin.`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      console.warn('⚠️ Failed to notify user:', e.message);
    }

    await ctx.editMessageText('✅ Marked as paid.');
    ctx.answerCbQuery();
  });

  // Ignore and refund
  bot.action(/^ignore_(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();

    const id = ctx.match[1];
    const db = readDb();
    const index = db.payouts.findIndex(p => p.id === id);
    if (index === -1) return ctx.answerCbQuery('❌ Request not found.');

    const req = db.payouts.splice(index, 1)[0];

    if (db.users[req.userId]) {
      db.users[req.userId].balance += req.amount;
    }

    writeDb(db);

    try {
      await ctx.telegram.sendMessage(
        req.userId,
        `⚠️ Your payout request was *ignored* and refunded *${req.amount} ${getCurrency()}*.`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      console.warn('⚠️ Could not notify user:', e.message);
    }

    await ctx.editMessageText('❌ Ignored and refunded.');
    ctx.answerCbQuery();
  });
};