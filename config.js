// config.js
require('dotenv').config();

const config = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  ADMIN_IDS: process.env.ADMIN_IDS
    ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim()))
    : [],
  PORT: process.env.PORT || 3000,
};

if (!config.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN not found in .env');
  process.exit(1);
}

module.exports = config;