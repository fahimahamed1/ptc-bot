// utils/inputGuard.js

const allowedCommands = [
  '/start',
  '/ads',
  '/balance',
  '/payout',
  '/referral',
  '/help'
];

function inputGuard(bot) {
  bot.on('text', async (ctx, next) => {
    const text = ctx.message.text;
    const command = text.split(' ')[0];

    // If the text is a command and not allowed
    if (text.startsWith('/') && !allowedCommands.includes(command)) {
      return ctx.reply("❓ Unknown command. Use /help to see available options.");
    }

    // If it's random text and no session flag is active
    if (
      !text.startsWith('/') &&
      !ctx.session.awaitingAd &&
      !ctx.session.awaitingBonus &&
      !ctx.session.awaitingCurrency &&
      !ctx.session.awaitingMinPayout
    ) {
      return ctx.reply("👋 Please use the buttons or commands. Type /help to see available options.");
    }

    await next();
  });
}

module.exports = inputGuard;