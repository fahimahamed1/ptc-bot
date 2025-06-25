const setupStart = require('./actions/start');
const setupAds = require('./actions/ads');
const setupBalance = require('./actions/balance');
const setupPayout = require('./actions/payout');
const setupHelp = require('./actions/help');
const setupReferral = require('./actions/referral');

module.exports = function setupBotCommands(bot) {
  setupStart(bot);
  setupAds(bot);
  setupBalance(bot);
  setupPayout(bot);
  setupReferral(bot);
  setupHelp(bot);
};