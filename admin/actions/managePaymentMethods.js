// admin/actions/managePaymentMethods.js
const { Markup } = require('telegraf');
const {
  getPaymentMethods,
  getPaymentPrompts,
  addPaymentMethod,
  removePaymentMethod,
} = require('../../database/db');

module.exports = function managePaymentMethods(bot) {
  // Entry button
  bot.action('manage_payment_methods', async (ctx) => {
    if (!ctx.session) ctx.session = {};
    ctx.session.awaitingAddMethodName = false;
    ctx.session.awaitingAddPrompt = false;
    ctx.session.newMethodName = null;
    ctx.session.awaitingRemoveMethod = false;

    await ctx.reply(
      '💼 Manage Payment Methods:',
      Markup.inlineKeyboard([
        [
          Markup.button.callback('🔍 Show Methods', 'show_payment_methods'),
          Markup.button.callback('➕ Add Method', 'add_payment_method'),
          Markup.button.callback('❌ Remove Method', 'remove_payment_method')
        ]
      ])
    );
    ctx.answerCbQuery();
  });

  // Show current payment methods
  bot.action('show_payment_methods', async (ctx) => {
    const methods = getPaymentMethods();
    const prompts = getPaymentPrompts();
    if (methods.length === 0) {
      await ctx.reply('⚠️ No payment methods added yet.');
    } else {
      const list = methods.map(m => `🔸 ${m} → ${prompts[m] || 'No prompt set'}`).join('\n');
      await ctx.reply(`💳 Available Methods:\n${list}`);
    }
    ctx.answerCbQuery();
  });

  // Begin add method flow
  bot.action('add_payment_method', async (ctx) => {
    ctx.session.awaitingAddMethodName = true;
    await ctx.reply('➕ Send the name of the new payment method (e.g., "Rocket")');
    ctx.answerCbQuery();
  });

  // Begin remove method flow
  bot.action('remove_payment_method', async (ctx) => {
    const methods = getPaymentMethods();
    if (methods.length === 0) {
      await ctx.reply('❌ No payment methods to remove.');
      return ctx.answerCbQuery();
    }
    await ctx.reply(
      '❌ Select a payment method to remove:',
      Markup.inlineKeyboard(
        methods.map(m => [Markup.button.callback(m, `delete_method_${m}`)])
      )
    );
    ctx.answerCbQuery();
  });

  // Handle dynamic delete buttons
  bot.action(/^delete_method_(.+)$/, async (ctx) => {
    const method = ctx.match[1];
    removePaymentMethod(method);
    await ctx.reply(`✅ Payment method "${method}" has been removed.`);
    ctx.answerCbQuery();
  });

  // Handle text inputs for add flow
  bot.on('text', async (ctx) => {
    if (!ctx.session) ctx.session = {};

    if (ctx.session.awaitingAddMethodName) {
      const method = ctx.message.text.trim();
      ctx.session.newMethodName = method;
      ctx.session.awaitingAddMethodName = false;
      ctx.session.awaitingAddPrompt = true;
      return ctx.reply(`✏️ Now send a prompt message for "${method}" (e.g., "Enter your ${method} number")`);
    }

    if (ctx.session.awaitingAddPrompt) {
      const prompt = ctx.message.text.trim();
      const method = ctx.session.newMethodName;

      addPaymentMethod(method, prompt);
      ctx.session.awaitingAddPrompt = false;
      ctx.session.newMethodName = null;
      return ctx.reply(`✅ Payment method "${method}" added with prompt: "${prompt}"`);
    }
  });
};
