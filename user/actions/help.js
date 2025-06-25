// actions/help.js
module.exports = function setupHelp(bot) {
  bot.command('help', (ctx) => {
    const helpMessage = `
🤖 *Bot Help Guide*

Welcome! Here are the commands you can use:

📌 *User Commands:*
/start - Start the bot or get your info
/ads - Browse ads and earn rewards by viewing
/balance - Check your current balance and earnings
/payout - Request payout when you have enough balance
/referral - Get your referral link to invite friends and earn bonuses
/help - Show this help message

💡 *Tips:*
- View ads to earn your rewards automatically credited.
- Use /referral to share your link and earn extra bonuses when friends join and watch ads.
- If you have any questions, contact the bot admin.

Thank you for using our bot! 🎉
    `;
    ctx.replyWithMarkdown(helpMessage);
  });
};