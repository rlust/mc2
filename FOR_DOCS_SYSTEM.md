# Mission Control - Dashboard Documentation

**Copy this section into your docs system at:** http://192.168.100.201:18888/#docs

---

## 🎯 Mission Control - OpenClaw Agent Dashboard

**Status:** ✅ Live (March 6, 2026)

Real-time web dashboard for monitoring OpenClaw agent sessions across Discord, Telegram, and direct channels.

### Quick Links
- **Local:** http://localhost:5173
- **Remote (Tailscale):** http://100.78.223.120:5173 (Mac Mini: `100.78.223.120`)
- **API:** http://localhost:3001/api/agents

---

## Architecture

| Component | Tech | Port | Purpose |
|-----------|------|------|---------|
| Backend | Node.js + Express | 3001 | Fetch/filter OpenClaw sessions via CLI |
| Frontend | Vue 3 + Cytoscape | 5173 | Interactive graph visualization |
| Graph | Cytoscape 3.28.1 | — | Physics-based node layout (COSE) |

---

## Features

✅ **Real-time Agent Visualization**
- Interactive Cytoscape graph with click-to-select nodes
- Auto-refresh every 5 seconds

✅ **Session Filtering**
- Shows: Discord, Telegram, Main sessions
- Hides: Cron jobs, system tasks, sub-agents

✅ **Remote Access**
- Tailscale VPN enabled (no port forwarding needed)
- Access from iPad, laptop, phone on Tailscale network

✅ **Auto-startup**
- LaunchAgent configured for Mac login
- Services restart on reboot

---

## Access

### Local Network (Mac Mini)
```
Frontend: http://localhost:5173
Backend:  http://localhost:3001
```

### Tailscale Network (Remote) ✅ **LIVE**
```
Frontend: http://100.78.223.120:5173 (Mac Mini)
Backend:  http://100.78.223.120:3001
Status:   Operational — March 7, 2026
```

---

## Service Management

```bash
# Start
~/mission-control/scripts/start-mission-control.sh

# Stop
pkill -f "npm run dev"

# Status
curl http://localhost:3001/api/agents | jq '.' | head -20

# Logs
tail -f ~/mission-control/logs/{backend,frontend}.log
```

---

## Configuration

**Backend Port:** Edit `~/mission-control/backend/server.js` (line: `app.listen(3001)`)

**Frontend Port:** Edit `~/mission-control/frontend/vite.config.js` (line: `port: 5173`)

**Session Filters:** Edit backend `/api/agents` endpoint to include/exclude session types

---

## Documentation

See full docs in:
- `~/mission-control/DOCUMENTATION.md` — Technical reference
- `~/mission-control/TAILSCALE_SETUP.md` — Remote access guide
- `~/mission-control/README.md` — Quick start

---

## Troubleshooting

**Port in use?**
```bash
lsof -i :3001  # or :5173
kill -9 <PID>
```

**No agents showing?**
```bash
# Test OpenClaw directly
openclaw sessions --json | jq '.sessions | length'

# Check backend filtering
curl http://localhost:3001/api/agents | jq '.nodes | length'
```

**Can't access via Tailscale?**
```bash
# Verify services running
ps aux | grep "npm run dev"

# Test from Tailscale device
curl http://100.78.223.120:3001/api/agents
```

---

**Status:** ✅ Operational  
**Auto-startup:** ✅ Enabled  
**Remote Access:** ✅ Ready
