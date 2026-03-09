# Mission Control: Quick Start Guide

Your OpenClaw monitoring dashboard is **live and ready**.

---

## 🚀 Access Dashboard

**Remote (Tailscale):**
```
http://100.78.223.120:5173
```

**Local:**
```
http://localhost:5173
```

---

## 📋 What You Have

✅ **Real-time agent monitoring**  
✅ **Performance graphs** (CPU/Memory/Disk)  
✅ **Service health checks**  
✅ **Cost analytics** (daily/weekly/monthly)  
✅ **Session logs** (activity per agent)  
✅ **Notification framework** (Telegram/Discord)  
✅ **Auto-restart capability** (for down services)  
✅ **System diagnostics**  

---

## 🔔 Enable Telegram Notifications (2 min)

### Step 1: Create Telegram Bot

1. Open Telegram app
2. Search for **@BotFather**
3. Send `/newbot`
4. Follow prompts:
   - Bot name: "Mission Control" (or whatever)
   - Username: "mission_control_bot" (must be unique, can be anything)
5. **Copy the token** (looks like `123456789:ABCdefGHIjklmno`)

### Step 2: Get Your Chat ID

1. Search for **@userinfobot** on Telegram
2. Send `/start`
3. **Copy your Chat ID** (a number like `987654321`)

### Step 3: Configure Dashboard

1. Edit `~/mission-control/.env`:
```bash
nano ~/mission-control/.env
```

2. Update these lines:
```
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmno
TELEGRAM_CHAT_ID=987654321
AUTO_RESTART=false
```

3. Save (Ctrl+X, then Y)

4. Restart backend:
```bash
pkill -f "node server.js"
cd ~/mission-control/backend && node server.js &
```

### Step 4: Test

1. Open dashboard: http://100.78.223.120:5173
2. Click 🔍 **Monitoring** → **Alerts** tab
3. Click 📱 **Telegram (Info)** button
4. Check your Telegram chat - message should arrive!

---

## 💬 Enable Discord Notifications (2 min)

### Step 1: Create Discord Webhook

1. Right-click your Discord server
2. **Server Settings** → **Integrations** → **Webhooks**
3. Click **Create Webhook**
4. Name: "Mission Control"
5. **Copy the Webhook URL**

### Step 2: Configure Dashboard

1. Edit `~/mission-control/.env`:
```bash
nano ~/mission-control/.env
```

2. Update this line:
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN
```

3. Save

4. Restart backend:
```bash
pkill -f "node server.js"
cd ~/mission-control/backend && node server.js &
```

### Step 3: Test

1. Open dashboard: http://100.78.223.120:5173
2. Click 🔍 **Monitoring** → **Alerts** tab
3. Click 💬 **Discord (Info)** button
4. Check your Discord channel - message should appear!

---

## 🔄 Enable Auto-Restart (1 min)

When enabled, services automatically restart if down for >60 seconds.

1. Edit `~/mission-control/.env`:
```bash
nano ~/mission-control/.env
```

2. Set:
```
AUTO_RESTART=true
```

3. Save & restart backend

4. In dashboard → 🔍 Monitoring → Services tab, you'll see:
```
🔄 Auto-Restart: ✅ ENABLED
```

---

## 📊 Dashboard Tabs

### **Events** (Main tab)
- Real-time OpenClaw agent activity
- Agent status + model info
- Event log

### **Context**
- Session details
- Token usage
- Click agent → see full details

### **Alerts** 
- System errors
- Service status
- Manual alerts

### **HVAC** 
- Thermostat controls (when RV online)
- Temperature settings
- Mode control

### **Costs**
- Daily/weekly/monthly spending
- Per-agent breakdown
- Budget forecasting

### 🔍 **Monitoring** (Advanced)
- **Performance Tab**: CPU/Memory/Disk graphs + trends
- **Services Tab**: Service health + manual restart
- **Alerts Tab**: Notification settings + test buttons
- **Logs Tab**: Per-agent activity logs

### 🔧 **Diagnostics**
- System health checks
- Service repairs
- Port verification

---

## 📝 Test Notifications

Once credentials are set, test them:

1. Dashboard → 🔍 Monitoring → **Alerts** tab

2. Send test:
   - 📱 **Telegram (Info)** - Info-level message
   - 📱 **Telegram (Warning)** - Warning-level message  
   - 💬 **Discord (Info)** - Discord message

3. Check your Telegram chat or Discord channel

---

## ⚙️ Configuration Files

```
~/mission-control/.env              # Your credentials (SECRET)
~/mission-control/.env.example      # Template
~/mission-control/NOTIFICATIONS_SETUP.md  # Detailed setup
~/mission-control/backend/server.js # API server
~/mission-control/frontend/src/     # Dashboard components
```

---

## 🐛 Troubleshooting

### Dashboard not loading?
```bash
# Check if services are running
curl http://127.0.0.1:3001/api/agents
curl http://127.0.0.1:5173

# If not, restart them
pkill -f "node server"
pkill -f vite
cd ~/mission-control/backend && node server.js &
cd ~/mission-control/frontend && npm run dev &
```

### Notifications not sending?
- Check `.env` file exists with correct values
- Check bot/webhook credentials are valid
- Verify backend was restarted after `.env` change
- Check backend logs: `tail ~/mission-control/logs/backend.log`

### Auto-restart not working?
- Verify `AUTO_RESTART=true` in `.env`
- Check backend logs for errors
- Manually test restart button in dashboard

---

## 🔗 Useful Commands

```bash
# View backend logs
tail -f ~/mission-control/logs/backend.log

# View frontend logs
tail -f ~/mission-control/logs/frontend.log

# Restart services
pkill -f "node server" && cd ~/mission-control/backend && node server.js &
pkill -f vite && cd ~/mission-control/frontend && npm run dev &

# Check what's using ports
lsof -i :3001   # Backend
lsof -i :5173   # Frontend

# View current config
cat ~/mission-control/.env
```

---

## 📚 Full Documentation

For detailed setup instructions, see:
- `~/mission-control/NOTIFICATIONS_SETUP.md` - Complete Telegram/Discord setup
- Dashboard → 🔍 Monitoring → Alerts tab → **Show Setup** button

---

## ✅ You're All Set!

**Dashboard is live:** http://100.78.223.120:5173

**Next:**
1. ✅ Get Telegram/Discord credentials (2 min each)
2. ✅ Update `.env` file
3. ✅ Test notifications
4. ✅ Enable auto-restart
5. ✅ Monitor your OpenClaw ecosystem

Questions? Check logs or dashboard help sections.
