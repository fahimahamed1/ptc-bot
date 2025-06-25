# 💸 Telegram PTC Bot

A fully-featured **Telegram Paid-To-Click (PTC)** Bot that allows users to earn money by viewing ads, referring others, and requesting payouts. Admins can manage ads, users, payout settings, and payment methods from a clean panel.

---

## 📦 Features

### 👤 User Features
- `/start` — Register and get referral benefits.
- `/ads` — View and earn from ads.
- `/balance` — See your current balance.
- `/payout` — Request payout via Bkash, Nagad, Binance, etc.
- `/referral` — Get your referral link and referral stats.
- `/help` — Bot usage guide.

### 👮 Admin Features
- `/admin` — Access admin panel with:
  - ➕ Add Ad
  - 📃 List Ads
  - ❌ Delete Ad
  - 💸 Payouts (Mark Paid / Refund)
  - 🎁 Set Referral Bonus
  - 💱 Set Currency
  - 🎯 Set Min Payout
  - 🏦 Manage Payment Methods
  - 📊 View Stats

---

## 🧠 Tech Stack

- **Node.js** + **Telegraf**
- **JSON-based** lightweight storage (no DB setup)
- Simple session & state management

---

## 🔧 Setup

1. **Clone the repo**  
```bash
git clone https://github.com/fahimahamed1/ptc-bot.git
cd ptc-bot
```

2. **Install dependencies**  
```bash
npm install
```

3. **Set environment variables**  
Create a `.env` file:
```
BOT_TOKEN=your_bot_token_here
ADMIN_IDS=admn_chatid_here
PORT=3000 (opt)
```

4. **Run the bot**  
```bash
npm start
```

---

## 🧪 Testing

- Add some ads via admin panel
- Try viewing ads as a user
- Refer others using your referral link
- Test payout functionality

---

## 📜 License

MIT — Feel free to use, modify, and share.

---

## 🙌 Credits

Created by [Fahim Ahamed] with ❤️ using Node.js & Telegraf.
