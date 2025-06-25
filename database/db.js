const fs = require('fs');
const path = require('path');
const { ADMIN_IDS } = require('../config');

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'ptc-db.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Default DB template
function getDefaultDb() {
  return {
    users: {},
    ads: [],
    payouts: [],
    confirmedPayouts: [],
    refBonus: 10,
    currency: 'BDT',
    minPayout: 10,
    paymentMethods: ['Bkash', 'Nagad', 'Binance'],
    paymentPrompts: {
      Bkash: 'Enter your Bkash number',
      Nagad: 'Enter your Nagad number',
      Binance: 'Enter your Binance ID',
    },
  };
}

// Read DB with fallback
function readDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      const def = getDefaultDb();
      fs.writeFileSync(dbPath, JSON.stringify(def, null, 2));
      return def;
    }

    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const def = getDefaultDb();

    // Ensure all keys exist
    for (const key of Object.keys(def)) {
      if (!(key in data)) data[key] = def[key];
    }

    return data;
  } catch (err) {
    console.error('❌ Error reading DB:', err);
    return getDefaultDb();
  }
}

// Write DB safely
function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Error writing DB:', err);
  }
}

// Admin check
function isAdmin(ctxOrId) {
  const id =
    typeof ctxOrId === 'object' && ctxOrId?.from?.id
      ? Number(ctxOrId.from.id)
      : Number(ctxOrId);

  if (!ADMIN_IDS.includes(id)) {
    if (typeof ctxOrId === 'object' && ctxOrId.reply) {
      try {
        ctxOrId.reply('❌ You are not an admin.');
      } catch (err) {
        console.warn('⚠️ Admin check message failed:', err.message);
      }
    }
    return false;
  }

  return true;
}

// Ensure user exists
function ensureUser(id) {
  const db = readDb();
  if (!db.users[id]) {
    db.users[id] = {
      id,
      balance: 0,
      referrals: 0,
      referralEarnings: 0,
      referrer: null,
      watched: {},
      payoutMethod: null,
      payoutAccount: null,
    };
    writeDb(db);
  }
  return db.users[id];
}

// Add referral bonus
function addReferral(db, referrerId, bonus) {
  if (db.users[referrerId]) {
    db.users[referrerId].balance += bonus;
    db.users[referrerId].referralEarnings += bonus;
    db.users[referrerId].referrals += 1;
  }
}

// Payment method utils
function getPaymentMethods() {
  return readDb().paymentMethods || [];
}

function getPaymentPrompts() {
  return readDb().paymentPrompts || {};
}

function setPaymentPrompt(method, promptText) {
  const db = readDb();
  db.paymentPrompts ??= {};
  db.paymentPrompts[method] = promptText;
  writeDb(db);
}

function removePaymentPrompt(method) {
  const db = readDb();
  if (db.paymentPrompts?.[method]) {
    delete db.paymentPrompts[method];
    writeDb(db);
    return true;
  }
  return false;
}

function addPaymentMethod(method, promptText) {
  const db = readDb();
  db.paymentMethods = db.paymentMethods || [];
  if (!db.paymentMethods.includes(method)) {
    db.paymentMethods.push(method);
  }
  db.paymentPrompts ??= {};
  db.paymentPrompts[method] = promptText;
  writeDb(db);
}

function removePaymentMethod(method) {
  const db = readDb();
  db.paymentMethods = (db.paymentMethods || []).filter(m => m !== method);
  if (db.paymentPrompts?.[method]) {
    delete db.paymentPrompts[method];
  }
  writeDb(db);
}

// Get current currency
function getCurrency() {
  return readDb().currency || '🪙';
}

function getMinPayout() {
  return readDb().minPayout || 10;
}

// Export all helpers
module.exports = {
  readDb,
  writeDb,
  isAdmin,
  ensureUser,
  getCurrency,
  getMinPayout,
  addReferral,
  getPaymentMethods,
  getPaymentPrompts,
  setPaymentPrompt,
  removePaymentPrompt,
  addPaymentMethod,
  removePaymentMethod,
};