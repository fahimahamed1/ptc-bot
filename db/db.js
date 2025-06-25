// utils/db.js
const fs = require('fs');
const path = require('path');
const { ADMIN_IDS } = require('../config');

const dbPath = path.join(__dirname, '..', 'ptc-db.json');

function getDefaultDb() {
  return {
    users: {},
    ads: [],
    payouts: [],
    confirmedPayouts: [],
    refBonus: 10,
    currency: 'BDT',
    minPayout: 9, // default min payout
  };
}

function readDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      const def = getDefaultDb();
      fs.writeFileSync(dbPath, JSON.stringify(def, null, 2));
      return def;
    }
    const data = JSON.parse(fs.readFileSync(dbPath));
    const def = getDefaultDb();
    for (const key of Object.keys(def)) {
      if (!(key in data)) data[key] = def[key];
    }
    return data;
  } catch (err) {
    console.error('Error reading DB:', err);
    return getDefaultDb();
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

function getCurrency() {
  return readDb().currency || '🪙';
}

function getMinPayout() {
  return readDb().minPayout || 9;
}

function isAdmin(ctxOrId) {
  let userId;
  if (typeof ctxOrId === 'string' || typeof ctxOrId === 'number') {
    userId = Number(ctxOrId);
  } else if (ctxOrId && ctxOrId.from) {
    userId = Number(ctxOrId.from.id);
  } else {
    return false;
  }
  return ADMIN_IDS.includes(userId);
}

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
    };
    writeDb(db);
  }
  return db.users[id];
}

function addReferral(db, referrerId, bonus) {
  if (db.users[referrerId]) {
    db.users[referrerId].balance += bonus;
    db.users[referrerId].referralEarnings += bonus;
    db.users[referrerId].referrals += 1;
  }
}

module.exports = {
  readDb,
  writeDb,
  getCurrency,
  getMinPayout,
  isAdmin,
  ensureUser,
  addReferral,
};