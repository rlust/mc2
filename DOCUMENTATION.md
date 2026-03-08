# Mission Control - OpenClaw Agent Dashboard

**Version:** 1.0.0  
**Date Created:** March 6, 2026  
**Status:** ✅ Live and Operational  
**Access:** Local & Tailscale Remote

---

## Overview

Mission Control is a real-time web dashboard for monitoring and managing OpenClaw agent sessions. Built with Vue 3, Cytoscape, and Node.js/Express, it provides:

- **Real-time agent visualization** with interactive graph layout
- **Session filtering** (automatically hides cron jobs and system tasks)
- **Remote access** via Tailscale VPN
- **Auto-refresh** every 5 seconds
- **Multi-channel support** (Discord, Telegram, Main sessions)

---

## Access

### Local Network
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

### Tailscale Network (Remote)
- **Frontend:** http://100.78.223.120:5173 ✅ **LIVE**
- **Backend API:** http://100.78.223.120:3001 ✅ **LIVE**

**Mac Mini Tailscale IP:** `100.78.223.120`
**Updated:** March 7, 2026 10:43 EST

---

## Architecture

### Backend (Node.js + Express)
- **Port:** 3001
- **Main Endpoint:** `/api/agents`
  - Fetches: `openclaw sessions --json`
  - Filters out cron jobs and system sessions
  - Returns: Active conversation sessions only
- **Response Format:**
  ```json
  {
    "nodes": [
      {
        "id": "session-id",
        "label": "Type: ChannelName",
        "status": "active",
        "model": "claude-haiku-4-5",
        "kind": "direct|group"
      }
    ],
    "edges": [],
    "timestamp": 1709783160000
  }
  ```

### Frontend (Vue 3 + Vite)
- **Port:** 5173
- **Framework:** Vue 3 (Composition API)
- **Graph Library:** Cytoscape 3.28.1
- **Layout:** COSE (physics-based graph layout)
- **Auto-refresh:** 5 seconds
- **Proxy:** `/api` requests routed to `http://localhost:3001`

---

## Features

### Dashboard
- **Agent List Panel:** Shows all active OpenClaw sessions
  - Displays: Session type, ID, model
  - Clickable: Select any agent for details
- **Graph Visualization:** Interactive Cytoscape graph
  - Nodes colored by type
  - Pan & zoom support
  - Click to select agent
- **Details Panel:** Selected agent information
  - Session ID
  - Model name
  - Session kind (direct or group)
  - Send message button (placeholder)
- **Stats Panel:** Quick counts
  - Total agents
  - By type breakdown

### Session Types
- **Main:** Direct OpenClaw main session
- **Discord:** Discord channel/thread sessions
- **Telegram:** Telegram group/direct sessions

---

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm/yarn
- Tailscale (for remote access)
- OpenClaw CLI installed and accessible

### Installation Steps

1. **Create directory structure:**
   ```bash
   mkdir -p ~/mission-control/{backend,frontend/src}
   ```

2. **Install dependencies:**
   ```bash
   cd ~/mission-control/backend && npm install
   cd ~/mission-control/frontend && npm install
   ```

3. **Start services:**
   ```bash
   # Terminal 1: Backend
   cd ~/mission-control/backend && npm run dev
   
   # Terminal 2: Frontend
   cd ~/mission-control/frontend && npm run dev
   ```

4. **Access dashboard:**
   - Local: http://localhost:5173
   - Remote (Tailscale): http://100.78.223.120:5173

---

## Auto-startup Configuration

### macOS LaunchAgent

**File:** `~/Library/LaunchAgents/com.mission-control.plist`

The dashboard auto-starts on Mac login via launchd:

```bash
# Load
launchctl load ~/Library/LaunchAgents/com.mission-control.plist

# Unload
launchctl unload ~/Library/LaunchAgents/com.mission-control.plist

# Check status
launchctl list | grep mission-control
```

---

## Service Management

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

### Manual Restart
```bash
pkill -f "npm run dev" && sleep 2
cd ~/mission-control/backend && npm run dev &
cd ~/mission-control/frontend && npm run dev &
```

---

## Configuration

### Backend Port
**File:** `~/mission-control/backend/server.js`
```javascript
app.listen(3001, () => console.log('🔴 Backend on http://localhost:3001'));
```

### Frontend Port & Proxy
**File:** `~/mission-control/frontend/vite.config.js`
```javascript
server: { 
  port: 5173, 
  proxy: { 
    '/api': { 
      target: 'http://localhost:3001', 
      changeOrigin: true 
    } 
  } 
}
```

### API Filtering Logic
**File:** `~/mission-control/backend/server.js`

Current filters (in `app.get('/api/agents')`):
- Excludes: `:cron:` (scheduled jobs)
- Excludes: `:subagent:` (spawned sub-agents)
- Includes: `:discord:`, `:telegram:`, `:main` (conversation sessions)

To adjust, edit the filter condition:
```javascript
.filter(s => 
  !s.key.includes(':cron:') && 
  !s.key.includes(':subagent:') &&
  (s.key.includes(':discord:') || s.key.includes(':telegram:') || s.key.includes(':main'))
)
```

---

## Tailscale Network Setup

### Enabling Remote Access

Mission Control is Tailscale-ready (no additional setup needed):

1. **Services listen on 0.0.0.0** (all interfaces)
2. **Tailscale VPN** automatically routes traffic
3. **Access from any Tailscale-connected device:**
   ```
   Browser → http://100.78.223.120:5173
   ```

### Verification

From another Tailscale device:
```bash
# Test API
curl http://100.78.223.120:3001/api/agents

# Test frontend
curl http://100.78.223.120:5173 | head -5
```

### Security Notes

- Tailscale provides encrypted, authenticated access
- No public internet exposure
- Only accessible to devices on your Tailscale network
- Add authentication if extending beyond Tailscale

---

## Troubleshooting

### Port Already in Use
```bash
# Find what's using port 3001 or 5173
lsof -i :3001
lsof -i :5173

# Kill the process
kill -9 <PID>
```

### Services Not Starting
```bash
# Check logs
tail -f ~/mission-control/logs/backend.log
tail -f ~/mission-control/logs/frontend.log

# Test backend directly
curl http://localhost:3001/api/agents

# Test frontend
curl http://localhost:5173
```

### No Agents Showing
```bash
# Test OpenClaw command directly
openclaw sessions --json | jq '.sessions | length'

# Check API filtering
curl http://localhost:3001/api/agents | jq '.nodes | length'
```