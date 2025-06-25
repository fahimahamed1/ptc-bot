// admin.js
const { Markup } = require('telegraf');
const { isAdmin } = require('../database/db');

const addAd = require('./actions/addAd');
const setRefBonus = require('./actions/setRefBonus');
const setCurrency = require('./actions/setCurrency');
const setMinPayout = require('./actions/setMinPayout');
const listAds = require('./actions/listAds');
const deleteAds = require('./actions/deleteAds');
const payouts = require('./actions/payouts');
const stats = require('./actions/stats');

module.exports = function setupAdminPanel(bot) {
  // Admin panel entry
  bot.command('admin', (ctx) => {
    if (!isAdmin(ctx)) return;

    ctx.reply(
      '🛠 Admin Panel',
      Markup.inlineKeyboard([
        [
          Markup.button.callback('➕ Add Ad', 'add_ad'),
          Markup.button.callback('📃 List Ads', 'list_ads'),
          Markup.button.callback('❌ Delete Ad', 'delete_ad')
        ],
        [
          Markup.button.callback('💸 Payouts', 'admin_payout'),
          Markup.button.callback('🎁 Set Ref Bonus', 'set_ref_bonus'),
          Markup.button.callback('💱 Set Currency', 'set_currency')
        ],
        [
          Markup.button.callback('🎯 Set Min Payout', 'set_min_payout'),
          Markup.button.callback('📊 Stats', 'state_panel')
        ]
      ])
    );
  });

  // Register all admin action modules
  addAd(bot);
  setRefBonus(bot);
  setCurrency(bot);
  setMinPayout(bot);
  listAds(bot);
  deleteAds(bot);
  payouts(bot);
  stats(bot);
};
