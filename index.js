// index.js
const { Telegraf, session } = require('telegraf');
const { BOT_TOKEN, PORT } = require('./config');
const setupBotCommands = require('./user/commands');
const setupAdminPanel = require('./admin/admin');
const inputGuard = require('./user/utils/inputGuard');
const express = require('express');

// Init bot
const bot = new Telegraf(BOT_TOKEN);

// Session middleware
bot.use(session());
bot.use(async (ctx, next) => {
  ctx.session ??= {};
  await next();
});

// nput filter before command handling
inputGuard(bot);

// Register user and admin features
setupBotCommands(bot);
setupAdminPanel(bot);

// Web status
const app = express();
app.get('/', (_, res) => res.send('✅ PTC Bot is running'));
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));

// Launch
bot.launch()
  .then(() => console.log('🤖 Bot launched and ready'))
  .catch((err) => {
    console.error('❌ Launch failed:', err);
    process.exit(1);
  });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));