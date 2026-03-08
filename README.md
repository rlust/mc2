# Mission Control - OpenClaw Agent Dashboard

Real-time visualization of OpenClaw sessions with Cytoscape graph, Tailscale-enabled remote access.

## Local Access

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## Tailscale Access

**Mac Mini Tailscale IP:** `100.78.223.120`

Access from any Tailscale-connected device:
- **Frontend:** http://100.78.223.120:5173
- **Backend API:** http://100.78.223.120:3001

## Services Running

### Backend (Node.js Express)
- Port: **3001**
- Endpoint: `/api/agents` — fetches OpenClaw sessions, filters out cron jobs
- Auto-starts: `cd ~/mission-control/backend && npm run dev`

### Frontend (Vue 3 + Vite)
- Port: **5173**
- Framework: Vue 3
- Graph Lib: Cytoscape (interactive node visualization)
- Proxies `/api` calls to `http://localhost:3001`

## Starting Services

```bash
# Terminal 1: Backend
cd ~/mission-control/backend
npm run dev

# Terminal 2: Frontend
cd ~/mission-control/frontend
npm run dev
```

Both are currently running in the background.

## Dashboard Features

- **Real-time agent list** from `openclaw sessions --json`
- **Graph visualization** with Cytoscape (cose layout)
- **Auto-refresh** every 5 seconds
- **Agent selection** — click any node to highlight
- **Session details** — model, status, kind (direct/group)
- **Sidebar panels** — active agents, selected agent info, stats

## Next Steps

- [ ] Add message sending (currently shows placeholder)
- [ ] Persist selected agent to localStorage
- [ ] Add filtering by agent type (Discord, Telegram, Main)
- [ ] Real-time updates via WebSocket instead of polling

