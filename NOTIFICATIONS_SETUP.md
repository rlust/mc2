# Mission Control Notifications Setup

Real Telegram & Discord notifications are now integrated! This guide shows how to enable them.

## Quick Setup (2 minutes)

### 1. Get Telegram Credentials

**Create Bot:**
1. Open Telegram and search for **@BotFather**
2. Send `/start` then `/newbot`
3. Follow prompts, name your bot (e.g., "Mission Control")
4. Copy the **API TOKEN** (looks like: `123456789:ABCdefGHIjklmno`)

**Get Chat ID:**
1. Open Telegram and search for **@userinfobot**
2. Send `/start`
3. It will show your **Chat ID** (a number)

### 2. Get Discord Webhook (Optional)

1. Right-click Discord server → **Server Settings**
2. Go to **Webhooks** → **Create Webhook**
3. Name it "Mission Control"
4. Copy the **Webhook URL**

### 3. Set Environment Variables

**Option A: Create .env file**

```bash
# In ~/mission-control/ create or edit .env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmno
TELEGRAM_CHAT_ID=987654321
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123/abc
AUTO_RESTART=false
```

**Option B: Export environment variables (temporary)**

```bash
export TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklmno"
export TELEGRAM_CHAT_ID="987654321"
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/123/abc"
export AUTO_RESTART="false"
```

### 4. Restart Backend

```bash
# Kill old process
pkill -f "node server.js"

# Start new process
cd ~/mission-control/backend && npm run dev &
```

## Testing Notifications

1. Open dashboard: **http://100.78.223.120:5173**
2. Click **🔍 Monitoring** → **Alerts** tab
3. Click **📱 Telegram (Info)** button
4. Check your Telegram chat - you should see the message!

## Auto-Restart Setup

To enable automatic service restarts when services go down:

1. Set in .env: `AUTO_RESTART=true`
2. Restart backend
3. Services will automatically restart if down for >60 seconds

**How it works:**
- Health checks run every 30 seconds
- If service is down for 2 checks (1 minute), restart is triggered
- Notification sent when service is restarted
- Restart history logged in dashboard

## Environment Variables Reference

```
TELEGRAM_BOT_TOKEN      - Bot token from @BotFather
TELEGRAM_CHAT_ID        - Your Telegram user ID
DISCORD_WEBHOOK_URL     - Webhook URL from Discord server settings
AUTO_RESTART            - true/false (enable automatic restarts)
PORT                    - Backend port (default: 3001)
FRONTEND_PORT           - Frontend port (default: 5173)
```

## Troubleshooting

**Notifications not sending?**
- ❌ Check that TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set
- ❌ Check that bot is in your Telegram chat
- ❌ Verify Discord webhook URL is valid
- ✅ Check backend logs: `tail ~/mission-control/logs/backend.log`

**Auto-restart not working?**
- ❌ Check that AUTO_RESTART=true in .env
- ❌ Check backend has permission to kill/restart processes
- ✅ Watch logs: `tail -f ~/mission-control/logs/backend.log`

**Backend won't start?**
- ❌ Check port 3001 isn't in use: `lsof -i :3001`
- ❌ Check npm modules installed: `npm install` in backend directory
- ✅ Check for errors: `cat ~/mission-control/logs/backend.log`

## File Locations

```
Config:           ~/mission-control/.env
Example config:   ~/mission-control/.env.example
Backend server:   ~/mission-control/backend/server.js
Backend logs:     ~/mission-control/logs/backend.log
Frontend logs:    ~/mission-control/logs/frontend.log
```

## Example Notification Messages

**Info Level (ℹ️):**
```
ℹ️ [INFO] Service restarted: gateway
```

**Warning Level (⚠️):**
```
⚠️ [WARNING] Budget exceeded! Monthly projection: $125.50
```

**Critical Level (🚨):**
```
🚨 [CRITICAL] Gateway service down for 5 minutes
```

## What Gets Notifications

When configured, you receive alerts for:
- ✅ Service restart events
- ✅ Manual test notifications
- ✅ Budget threshold exceeded (when implemented)
- ✅ Service down alerts (when implemented)
- ✅ High CPU/Memory alerts (when implemented)

## Next Steps

1. ✅ Get Telegram bot token from @BotFather
2. ✅ Get Chat ID from @userinfobot
3. ✅ Create .env file with credentials
4. ✅ Restart backend
5. ✅ Test notification buttons
6. ✅ Enable AUTO_RESTART if desired
7. ✅ Check notification history in dashboard

---

Questions? Check backend logs or dashboard → Alerts tab → Show Setup
