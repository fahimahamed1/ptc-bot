const { Markup } = require('telegraf');
const {
  readDb,
  writeDb,
  ensureUser,
  getCurrency,
  getMinPayout,
  getPaymentMethods,
  getPaymentPrompts,
} = require('../../database/db');

module.exports = function setupPayout(bot) {
  // Handle /payout command
  bot.command('payout', async (ctx) => {
    const db = readDb();
    const userId = String(ctx.from.id);
    const user = db.users[userId] ?? ensureUser(userId);
    const minPayout = getMinPayout();

    ctx.session ??= {};
    ctx.session.payout = null; // cancel any previous flow

    if (user.balance < minPayout) {
      return ctx.reply(`❌ Minimum payout is ${minPayout} ${getCurrency()}. Your balance: ${user.balance}`);
    }

    if (db.payouts.find(p => p.userId === userId)) {
      return ctx.reply('⚠️ You already have a pending payout request.');
    }

    if (user.payoutMethod && user.payoutAccount) {
      return ctx.reply(
        `💳 You already set up your payment method:\n\n🔸 *Method:* ${user.payoutMethod}\n🔸 *Account:* ${user.payoutAccount}\n\nDo you want to update it or continue with this?`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('✅ Continue', 'payout_continue')],
            [Markup.button.callback('🔁 Update Method', 'payout_update')],
          ]),
        }
      );
    }

    const paymentMethods = getPaymentMethods();
    if (!paymentMethods.length) {
      return ctx.reply('❌ No payment methods available. Please contact admin.');
    }

    return ctx.reply(
      '💳 Please select your payment method:',
      Markup.inlineKeyboard(
        paymentMethods.map(method => [Markup.button.callback(method, `select_method_${method}`)])
      )
    );
  });

  // Select method
  bot.action(/^select_method_(.+)$/, async (ctx) => {
    const method = ctx.match[1];
    const userId = String(ctx.from.id);
    ensureUser(userId);

    const prompts = getPaymentPrompts();
    const promptMessage = prompts[method] || `📲 Enter your ${method} account or number:`;

    ctx.session ??= {};
    ctx.session.payout = {
      step: 'awaiting_account',
      method,
    };

    await ctx.reply(promptMessage);
    await ctx.answerCbQuery();
  });

  // Update method
  bot.action('payout_update', async (ctx) => {
    const paymentMethods = getPaymentMethods();
    if (!paymentMethods.length) {
      await ctx.reply('❌ No payment methods available. Please contact admin.');
      return ctx.answerCbQuery();
    }

    ctx.session ??= {};
    ctx.session.payout = null;

    await ctx.reply(
      '🔁 Select a new payment method:',
      Markup.inlineKeyboard(
        paymentMethods.map(method => [Markup.button.callback(method, `select_method_${method}`)])
      )
    );
    await ctx.answerCbQuery();
  });

  // Continue with saved method
  bot.action('payout_continue', async (ctx) => {
    const userId = String(ctx.from.id);
    const db = readDb();
    const user = db.users[userId];
    const minPayout = getMinPayout();

    if (!user || !user.payoutMethod || !user.payoutAccount) {
      await ctx.reply('❌ You have no saved payment method. Please set it first.');
      return ctx.answerCbQuery();
    }

    ctx.session ??= {};
    ctx.session.payout = {
      step: 'awaiting_amount',
      method: user.payoutMethod,
      account: user.payoutAccount,
    };

    await ctx.reply(
      `💰 Your balance: ${user.balance} ${getCurrency()}\nEnter the amount to withdraw (min: ${minPayout}):`
    );
    await ctx.answerCbQuery();
  });

  // Cancel payout session on other commands
  bot.hears(/^\/(?!payout).*/, async (ctx, next) => {
    if (ctx.session?.payout) {
      ctx.session.payout = null;
      await ctx.reply('⚠️ Payout flow cancelled due to other command.');
    }
    return next();
  });

  // Handle text inputs for payout session
  bot.on('text', async (ctx, next) => {
    ctx.session ??= {};
    const userId = String(ctx.from.id);
    const payoutSession = ctx.session.payout;

    if (!payoutSession || !['awaiting_account', 'awaiting_amount'].includes(payoutSession.step)) {
      return next(); // not in payout mode
    }

    const db = readDb();
    const user = db.users[userId] ?? ensureUser(userId);

    if (payoutSession.step === 'awaiting_account') {
      const method = payoutSession.method;
      const account = ctx.message.text.trim();

      user.payoutMethod = method;
      user.payoutAccount = account;

      ctx.session.payout.step = 'awaiting_amount';
      writeDb(db);

      return ctx.reply(
        `✅ Payment method saved.\n💰 Your balance: ${user.balance} ${getCurrency()}\nNow enter the amount to withdraw:`
      );
    }

    if (payoutSession.step === 'awaiting_amount') {
      const amount = parseFloat(ctx.message.text.trim());
      const minPayout = getMinPayout();

      if (isNaN(amount) || amount <= 0) {
        return ctx.reply('❌ Please enter a valid number.');
      }
      if (amount > user.balance) {
        return ctx.reply(`❌ You don’t have enough balance. Your balance: ${user.balance}`);
      }
      if (amount < minPayout) {
        return ctx.reply(`❌ Minimum payout is ${minPayout} ${getCurrency()}.`);
      }

      const payout = {
        id: `payout_${Date.now()}`,
        userId,
        amount,
        method: user.payoutMethod,
        account: user.payoutAccount,
      };

      db.payouts.push(payout);
      user.balance -= amount;
      ctx.session.payout = null;
      writeDb(db);

      return ctx.reply(
        `✅ Payout request for ${amount} ${getCurrency()} via ${user.payoutMethod} submitted. Admin will review it soon.`
      );
    }
  });
};