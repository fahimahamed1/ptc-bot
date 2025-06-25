const setupStart = require('./include/start');
const setupAds = require('./include/ads');
const setupBalance = require('./include/balance');
const setupPayout = require('./include/payout');
const setupReferral = require('./include/referral');

module.exports = function setupBotCommands(bot) {
  setupStart(bot);
  setupAds(bot);
  setupBalance(bot);
  setupPayout(bot);
  setupReferral(bot);
};