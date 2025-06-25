const { isAdmin } = require('../../database/db');

const allowedCommands = [
  '/start',
  '/ads',
  '/balance',
  '/payout',
  '/referral',
  '/help',
  '/admin', // allow admin explicitly
];

function inputGuard(bot) {
  bot.on('text', async (ctx, next) => {
    const text = ctx.message.text.trim();
    const command = text.split(' ')[0];
    ctx.session ??= {};

    // Allow known commands
    if (text.startsWith('/')) {
      if (!allowedCommands.includes(command)) {
        // If it's /admin, allow only if it's an admin
        if (command === '/admin' && isAdmin(ctx)) return next();
        return ctx.reply('❓ Unknown command. Use /help to see available options.');
      }
    }

    // Allow if the user is in any valid input flow
    const validSession =
      ctx.session.awaitingAd ||
      ctx.session.awaitingBonus ||
      ctx.session.awaitingCurrency ||
      ctx.session.awaitingMinPayout ||
      ctx.session.awaitingAddMethodName ||
      ctx.session.awaitingAddPrompt ||
      (ctx.session.payout &&
        ['awaiting_account', 'awaiting_amount'].includes(ctx.session.payout.step));

    if (!text.startsWith('/') && !validSession) {
      return ctx.reply('👋 Please use the available buttons or commands.\nType /help to get started.');
    }

    await next();
  });

  // Optional: reject media
  bot.on(['photo', 'video', 'sticker', 'document', 'voice'], async (ctx) => {
    return ctx.reply('⚠️ Only text input is supported. Please use the buttons or commands.');
  });
}

module.exports = inputGuard;