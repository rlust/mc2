# Mission Control - Tailscale Remote Access Setup

## Current Status: ✅ Ready

Your Mission Control dashboard is now **Tailscale-enabled** and accessible from any device on your Tailscale network.

---

## 🌐 Access URLs

### Local Machine (Mac Mini)
```
Frontend: http://localhost:5173
Backend:  http://localhost:3001/api/agents
```

### Tailscale Network (Remote Access)
```
Frontend: http://100.78.223.120:5173
Backend:  http://100.78.223.120:3001/api/agents
```

**Tailscale IP:** `100.78.223.120` (Randy's Mac Mini)

---

## 🚀 How It Works

1. **Services Running:**
   - Backend (Express.js) on port 3001
   - Frontend (Vue 3 + Vite) on port 5173
   - Both bound to 0.0.0.0 (all interfaces)

2. **Tailscale Network:**
   - Automatically routes traffic through your Tailscale VPN
   - No port forwarding needed
   - Encrypted end-to-end
   - Works from anywhere

3. **Auto-startup (Mac Reboot):**
   - LaunchAgent: `com.mission-control.plist`
   - Location: `~/Library/LaunchAgents/`
   - Auto-starts both services on login

---

## 🛠️ Service Management

### Start Services
```bash
~/mission-control/scripts/start-mission-control.sh
```

### Check Status
```bash
ps aux | grep "npm run dev" | grep -v grep
curl http://localhost:3001/api/agents
```

### Stop Services
```bash
pkill -f "mission-control"
pkill -f "npm run dev"
```

### View Logs
```bash
tail -f ~/mission-control/logs/backend.log
tail -f ~/mission-control/logs/frontend.log
```

### Unload LaunchAgent
```bash
launchctl unload ~/Library/LaunchAgents/com.mission-control.plist
```

---

## 📱 Access from Other Devices

**From iPad/iPhone/Laptop on Tailscale network:**

Open browser → Visit `http://100.78.223.120:5173`

You'll see:
- Real-time agent dashboard
- Interactive Cytoscape graph
- All OpenClaw sessions (Discord, Telegram, Main)
- Auto-refresh every 5 seconds

---

## 🔧 Configuration

### If You Need to Change Ports

Edit these files:
- **Backend:** `~/mission-control/backend/server.js` (line: `app.listen(3001, ...)`)
- **Frontend:** `~/mission-control/frontend/vite.config.js` (line: `port: 5173`)

### If You Need to Change IP Binding

Current: `0.0.0.0` (listens on all interfaces)

To bind to localhost only (less secure but isolated):
```bash
# Backend server.js
app.listen(3001, 'localhost')
```

---

## ✅ Verification

From another device on your Tailscale network:

```bash
# Test backend
curl http://100.78.223.120:3001/api/agents | jq '.' | head -20

# Test frontend (should return HTML)
curl http://100.78.223.120:5173 | head -3
```

---

## 🎯 Next Steps

- [ ] Add authentication (if exposing to untrusted networks)
- [ ] Configure HTTPS with self-signed cert (if needed)
- [ ] Add real-time WebSocket updates (vs polling)
- [ ] Enable message sending to agents from dashboard

---

**Setup Date:** March 6, 2026  
**Status:** ✅ Live and Remote-Ready
