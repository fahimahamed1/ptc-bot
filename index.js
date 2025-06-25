const { Telegraf, session } = require('telegraf');
const { BOT_TOKEN, PORT } = require('./config');
const setupBotCommands = require('./user/commands');
const setupAdminPanel = require('./admin/admin');
const inputGuard = require('./user/utils/inputGuard');
const express = require('express');

const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

// Init session
bot.use(async (ctx, next) => {
  ctx.session ??= {};
  await next();
});

// Register features
setupBotCommands(bot);
setupAdminPanel(bot);
inputGuard(bot);

// Web server
const app = express();
app.get('/', (_, res) => res.send('✅ PTC Bot is running'));
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));

// Launch bot
bot.launch()
  .then(() => console.log('🤖 Bot launched and ready'))
  .catch((err) => {
    console.error('❌ Launch failed:', err);
    process.exit(1);
  });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));