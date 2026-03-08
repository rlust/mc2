# Mission Control - Documentation Index

All documentation for the Mission Control dashboard.

## 📄 Core Documentation

| File | Purpose | Audience |
|------|---------|----------|
| **DOCUMENTATION.md** | Complete technical reference | Developers, DevOps |
| **README.md** | Quick start guide | All users |
| **TAILSCALE_SETUP.md** | Remote access & networking | Network admins |
| **FOR_DOCS_SYSTEM.md** | Copy/paste for docs wiki | Documentation managers |

## 🚀 Quick Start

1. **Local access:** http://localhost:5173
2. **Remote access (Tailscale):** http://100.78.223.120:5173
3. **Start services:** `~/mission-control/scripts/start-mission-control.sh`
4. **Stop services:** `pkill -f "npm run dev"`

## 🔧 Service Location

```
~/mission-control/
├── backend/              # Node.js/Express server (port 3001)
│   ├── server.js
│   ├── package.json
│   └── node_modules/
├── frontend/             # Vue 3 + Vite app (port 5173)
│   ├── src/
│   │   ├── App.vue
│   │   └── main.js
│   ├── vite.config.js
│   ├── package.json
│   └── node_modules/
├── scripts/              # Utility scripts
│   └── start-mission-control.sh
├── logs/                 # Auto-created by services
│   ├── backend.log
│   └── frontend.log
└── docs/                 # Documentation (this folder)
```

## 📋 Documentation Files

### DOCUMENTATION.md
**The complete technical reference**
- Architecture overview
- Installation steps
- Configuration reference
- Troubleshooting guide
- API documentation
- Tailscale setup
- Security notes

→ **Use for:** Deep technical questions, setup from scratch, configuration changes

### README.md
**Quick start for new users**
- Feature overview
- Local access URLs
- Service startup commands
- Next steps checklist

→ **Use for:** Getting started, basic operation, feature summary

### TAILSCALE_SETUP.md
**Remote access guide**
- Access URLs (local + Tailscale)
- How it works
- Service management
- Configuration for different networks
- Verification steps

→ **Use for:** Accessing from iPad/laptop, troubleshooting remote access, network setup

### FOR_DOCS_SYSTEM.md
**Wiki-ready documentation**
- Copy/paste into your docs wiki
- Markdown formatted for docs sites
- Quick reference table
- Condensed troubleshooting

→ **Use for:** Adding to documentation website (http://192.168.100.201:18888/#docs)

---

## 🔍 Finding Information

**I want to...**

- **Get started quickly** → Read `README.md`
- **Access from my iPad** → Read `TAILSCALE_SETUP.md`
- **Troubleshoot a problem** → See `DOCUMENTATION.md` § Troubleshooting
- **Change ports or configuration** → See `DOCUMENTATION.md` § Configuration
- **Understand the architecture** → See `DOCUMENTATION.md` § Architecture
- **Add to documentation wiki** → Copy `FOR_DOCS_SYSTEM.md`

---

## 🎯 Key URLs

### Access
- **Local:** http://localhost:5173
- **Remote (Tailscale):** http://100.78.223.120:5173

### Backend API
- **Local:** http://localhost:3001/api/agents
- **Remote:** http://100.78.223.120:3001/api/agents

### Your Docs Wiki
- **Docs Site:** http://192.168.100.201:18888/#docs
  - Add content from `FOR_DOCS_SYSTEM.md`

---

## 📝 Updates & Maintenance

**Last Updated:** March 6, 2026  
**Status:** ✅ Operational

### What's Documented
- ✅ Installation & setup
- ✅ Local & remote access
- ✅ Service management
- ✅ Configuration options
- ✅ Troubleshooting
- ✅ Tailscale networking

### What's Not (Yet)
- 🔲 Message sending to agents
- 🔲 WebSocket real-time updates
- 🔲 Authentication/security
- 🔲 Scaling to multiple machines

---

## 💡 Tips

1. **Services auto-start on Mac reboot** via `com.mission-control.plist`
2. **Logs are written to** `~/mission-control/logs/` for debugging
3. **OpenClaw command** can be tested: `openclaw sessions --json`
4. **Tailscale IP is fixed** for your Mac (100.78.223.120)
5. **Session filtering** can be customized in backend's `/api/agents` endpoint

---

**Need help?** Check `DOCUMENTATION.md` § Troubleshooting
