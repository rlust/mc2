# Discord Webhook Setup - Step by Step

## What You Need To Do In Discord

### Step 1: Choose a Channel
Pick which channel you want notifications in (e.g., #general, #alerts, etc.)

### Step 2: Create Webhook
1. Right-click the channel name
2. **Edit Channel** → **Integrations** → **Webhooks**
3. Click **Create Webhook**
4. Name it: "Mission Control Dashboard"
5. Click **Copy Webhook URL**
6. **IMPORTANT:** Save this URL somewhere safe!

URL format:
```
https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

### Step 3: Configure Dashboard
1. SSH into Mac mini or edit locally:
```bash
nano ~/mission-control/.env
```

2. Add/Update this line:
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

3. Save (Ctrl+X, Y, Enter)

### Step 4: Restart Backend
```bash
pkill -f "node server.js"
cd ~/mission-control/backend && node server.js &
```

### Step 5: Test
1. Dashboard: http://100.78.223.120:5173
2. Click 🔍 **Monitoring** → **Alerts** tab
3. Click 💬 **Discord (Info)**
4. Check your Discord channel - message should appear!

## Troubleshooting

**Message not showing up?**
- Verify webhook URL in .env is correct
- Check that backend was restarted after editing .env
- Make sure the channel isn't archived
- Check Discord bot permissions (usually auto-granted)

**Wrong channel getting messages?**
- Delete the webhook
- Create new webhook in correct channel
- Update .env with new URL
- Restart backend

**Can't create webhook?**
- Need "Manage Webhooks" permission in that channel
- Ask server admin to grant you that permission

---

Once set up, you can test different severity levels:
- 📱 Telegram (Info/Warning)
- 💬 Discord (Info)
- Both at once

All messages go to the channels you configured.
