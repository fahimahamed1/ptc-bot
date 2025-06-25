
# 📢 Telegram Ads Bot (PTC) 💰

This is a **Paid-To-Click (PTC)** Telegram bot built with **Node.js** and **Telegraf**. It allows admins to post ads, and users to earn money by viewing them. The bot supports referral bonuses, ad tracking, user balances, payout requests, and more.

---

## ✅ Features

### 🛠 Admin Panel
- Add new ads `id|url|reward`
- List all active ads
- Delete selected ads
- Set referral bonus
- Set currency symbol
- Set minimum payout limit
- View payout requests
- Mark payouts as paid or refund
- View bot-wide stats

### 👤 User Side
- Start & register
- View and earn from ads
- Track earnings and referrals
- Check balance
- Request payouts (if min reached)
- Get referral link

---

## 🧠 Tech Stack

- **Node.js**
- **Telegraf**
- **JSON** for simple storage
- **dotenv** for env vars
- Optional: Can be hosted on **Render**, **Heroku**, **VPS**, or **Replit**

---

## ⚙️ Setup Guide

### 1. Clone the project

```bash
git clone https://github.com/fahimahamed1/ptc-bot.git
cd ptc-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env`

```env
BOT_TOKEN=your_telegram_bot_token
ADMIN_IDS=admin_chatid_here
```

`ADMIN_IDS` should be a comma-separated list of Telegram user IDs allowed to use admin commands.

### 4. Run the bot

```bash
npm start
```

---

## 📌 Usage

- **User**: Just start the bot and follow the buttons.
- **Admin**: Use `/admin` command to access the panel and manage ads, referrals, payouts, and settings.

---

## 📦 Data Stored In JSON

- All user info, ads, payouts, and settings are stored in a simple local `db.json` file via `readDb()` / `writeDb()`.

---

## 🧪 Example Ad Format

When adding an ad:
```
id123|https://yourlink.com|10
```

---

## 💡 Tips

- You can customize payout currency from the panel.
- Use stats panel to monitor your bot usage.
- Referral earnings are automatically tracked.
- Project is modular — easily extendable.

---

## 📄 License

MIT © 2025 – Feel free to modify and improve this project.
