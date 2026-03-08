# Mission Control - Functions Reference

**Version:** 1.0.0  
**Last Updated:** March 7, 2026 10:43 EST  
**Status:** ✅ Fully Operational

---

## 🎯 Overview

Mission Control is a **real-time OpenClaw agent dashboard**. It monitors active sessions across Discord, Telegram, and direct channels, displays them in an interactive graph, and provides quick status at a glance.

**Access:**
- **Tailscale Remote:** http://100.78.223.120:5173 ✅
- **Local Network:** http://localhost:5173
- **API:** http://localhost:3001/api/agents

---

## 📊 Main Dashboard Functions

### Left Sidebar - Navigation
| Section | Function | Purpose |
|---------|----------|---------|
| **Overview** | Home view | Main dashboard with agent graph |
| **Tasks** | Task list | Scheduled/pending agent work |
| **Pinvigo** | Photo gallery | Connected Piwigo instance |
| **Newark** | Home system | Newark HA status & controls |
| **Health** | Monitoring | Mac Mini + Hetzner VPS health |
| **Costs** | Budget tracker | API usage and spending |
| **Agents** | Session list | All active OpenClaw sessions |
| **Aspire RV** | RV controls | Aspire motorhome systems |
| **Schedule** | Cron jobs | Scheduled automation |
| **Docs** | Documentation | This page + app guides |
| **HVAC** | Climate control | RV-C thermostat commands |
| **Discord** | Chat link | Direct to Discord app |

---

## 📈 System Health Panel

### Mac Mini Status
- **CPU:** Real-time usage bar (green = healthy)
- **Memory:** RAM consumption (target: <65%)
- **Disk:** Storage usage (⚠️ Alert if >80%)

### Hetzner VPS Status
- **CPU:** Cloud server usage (target: <50%)
- **Memory:** Container/app memory (target: <60%)
- **Disk:** VPS storage (⚠️ Alert if >70%)

**Color Coding:**
- 🟢 **Green (0-60%)** → Normal
- 🟡 **Yellow (60-80%)** → Monitor
- 🔴 **Red (80%+)** → Alert

---

## 🔌 API Endpoints (Backend)

### GET `/api/agents`
**Returns:** Active OpenClaw sessions in graph format

**Response:**
```json
{
  "nodes": [
    {
      "id": "session-key",
      "label": "Type: ChannelName",
      "status": "active",
      "model": "claude-haiku-4-5",
      "kind": "direct|group",
      "timestamp": 1709783160000
    }
  ],
  "edges": [],
  "timestamp": 1709783160000
}
```

**Query Filters:**
- Includes: Discord, Telegram, Main sessions
- Excludes: Cron jobs, sub-agents, system tasks
- Refresh: Every 5 seconds

### GET `/api/agents?limit=50`
**Returns:** Last 50 agent sessions (including closed)

---

## 🎨 Graph Visualization (Cytoscape)

### Interactive Features
| Action | Function |
|--------|----------|
| **Click node** | Select agent, show details |
| **Drag node** | Pan graph |
| **Scroll** | Zoom in/out |
| **Hover** | Show agent name |
| **Right-click** | Context menu (planned) |

### Node Colors
- 🔵 **Blue** → Direct/Main sessions
- 🟣 **Purple** → Discord sessions
- 🟢 **Green** → Telegram sessions
- ⚪ **Gray** → Inactive/closed

### Graph Layout
- **Type:** COSE (physics-based)
- **Physics:** Spring attraction/repulsion
- **Auto-adjust:** Real-time repositioning

---

## 🎮 Control Panels

### Agent Details Sidebar
When you click a node, shows:
- **Session ID** - Unique identifier
- **Channel** - Discord/Telegram/Direct
- **Model** - AI model running (Haiku/Sonnet/etc)
- **Status** - Active/Idle/Error
- **Kind** - Direct chat or group
- **Send Message** - (Placeholder for future)

### Stats Panel
- **Total Agents:** Count of active sessions
- **By Type:** Breakdown (Discord, Telegram, Direct)
- **Uptime:** Time since last restart
- **API Calls:** Session queries per minute

---

## 🔧 Configuration & Customization

### Session Filtering
**Edit:** `~/mission-control/backend/server.js`

Current filter logic:
```javascript
// Include these
- :discord: channels/threads
- :telegram: groups/channels  
- :main: direct sessions

// Exclude these
- :cron: scheduled jobs
- :subagent: spawned agents
```

### Ports
- **Backend:** Edit `server.js` line ~20
- **Frontend:** Edit `vite.config.js` port setting

### Auto-refresh Rate
**Edit:** `~/mission-control/frontend/src/App.vue`
```javascript
setInterval(fetchAgents, 5000) // milliseconds
```

---

## 🚀 Service Management

### Start/Stop
```bash
# Start all
~/mission-control/scripts/start-mission-control.sh

# Stop all
pkill -f "npm run dev"

# Manual start
cd ~/mission-control/backend && npm run dev &
cd ~/mission-control/frontend && npm run dev &
```

### View Logs
```bash
tail -f ~/mission-control/logs/backend.log
tail -f ~/mission-control/logs/frontend.log
```

### Auto-start on Mac Login
- Enabled via LaunchAgent: `com.mission-control.plist`
- Check: `launchctl list | grep mission-control`

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| **Port in use** | `lsof -i :3001` → `kill -9 <PID>` |
| **No agents showing** | `openclaw sessions --json` check |
| **Backend 404** | Verify `npm run dev` in backend dir |
| **Tailscale not loading** | Check `100.78.223.120:5173` connectivity |
| **Graph not updating** | Browser refresh (Cmd+R) or `npm run dev` restart |

---

## 📋 Future Improvements

- [ ] Send messages directly from dashboard
- [ ] Agent performance metrics (latency, cost)
- [ ] Session history/archive view
- [ ] Custom alerts & notifications
- [ ] Export session logs
- [ ] Webhook triggers for events
- [ ] Dark/light theme toggle
- [ ] Mobile responsive design

---

## 📞 Support

**Logs:** `~/mission-control/logs/`  
**Repo:** GitHub (if applicable)  
**Contact:** HAL (OpenClaw assistant)

---

**Status:** ✅ **LIVE & OPERATIONAL**  
**Tailscale URL:** http://100.78.223.120:5173  
**API Health:** http://100.78.223.120:3001/api/agents
