# Mission Control - Quick Access Guide

**Updated:** March 7, 2026 10:43 EST

---

## 🎯 Access Mission Control

### Remote (Tailscale)
```
http://100.78.223.120:5173
```
✅ Works from any device on Tailscale network (iPad, laptop, phone)

### Local Network
```
http://localhost:5173
```
✅ Works from Mac Mini only

### API (Backend)
```
http://localhost:3001/api/agents
http://100.78.223.120:3001/api/agents (Tailscale)
```

---

## 🚀 Start Mission Control

```bash
~/mission-control/scripts/start-mission-control.sh
```

Or manually:
```bash
# Terminal 1
cd ~/mission-control/backend && npm run dev

# Terminal 2
cd ~/mission-control/frontend && npm run dev
```

---

## 🛑 Stop Mission Control

```bash
pkill -f "npm run dev"
```

---

## 📊 What It Does

✅ **Real-time Agent Graph** - See all active OpenClaw sessions  
✅ **System Health** - Mac Mini & Hetzner VPS monitoring  
✅ **Interactive Dashboard** - Click agents for details  
✅ **Auto-refresh** - Updates every 5 seconds  
✅ **Remote Access** - Tailscale VPN enabled  
✅ **Auto-startup** - Runs on Mac login  

---

## 📚 Full Documentation

- **FUNCTIONS_REFERENCE.md** - All dashboard features & API endpoints
- **DOCUMENTATION.md** - Technical deep-dive
- **FOR_DOCS_SYSTEM.md** - Docs system copy

---

## 🔧 Quick Troubleshooting

**Port in use?**
```bash
lsof -i :3001
kill -9 <PID>
```

**No agents showing?**
```bash
openclaw sessions --json | jq '.sessions | length'
```

**Check service status:**
```bash
ps aux | grep "npm run dev" | grep -v grep
curl http://localhost:3001/api/agents
```

---

**Status:** ✅ **OPERATIONAL**  
**Tailscale URL:** http://100.78.223.120:5173  
**Last Check:** March 7, 2026
