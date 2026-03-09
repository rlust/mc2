# Home Assistant Integration Setup

## Overview
The Mission Control dashboard now includes full Home Assistant controls for both Newark home and Aspire RV. Mock data is available for testing.

## Current Status
- ✅ Backend endpoints working with mock data
- ✅ Frontend component ready
- ⏳ Waiting for real HA token to connect to actual instances

## Setup Instructions

### 1. Get Newark HA Token

1. Go to Home Assistant (Newark): https://rlust.ui.nabu.casa
2. Click your profile icon (bottom left)
3. Scroll to "Long-Lived Access Tokens"
4. Click "Create Token"
5. Name it "Mission Control"
6. Copy the token (starts with `eyJ...`)

### 2. Get Aspire RV HA Token (when RV is online)

1. Go to Home Assistant (Aspire RV): http://192.168.1.100:8123
   - Or use local network IP if different
2. Click your profile icon (bottom left)
3. Scroll to "Long-Lived Access Tokens"
4. Click "Create Token"
5. Name it "Mission Control Aspire"
6. Copy the token

### 3. Update .env File

Edit `~/mission-control/.env`:

```bash
# ... existing config ...

# Home Assistant Configuration
NEWARK_HA_URL=https://rlust.ui.nabu.casa
NEWARK_HA_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGc...  (paste full token)

ASPIRE_HA_URL=http://192.168.1.100:8123
ASPIRE_HA_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGc...  (paste full token, when RV online)
```

### 4. Restart Backend

```bash
pkill -9 -f "node server"
cd ~/mission-control/backend
node server.js &
```

### 5. Test Dashboard

Open: http://100.78.223.120:5173

- Click **Home** tab
- Should show "✅ Connected to newark" (or aspire)
- Try controlling a light!

## Endpoints

All endpoints support both instances: `newark` and `aspire`

### GET /api/ha/config
```bash
curl "http://localhost:3001/api/ha/config?instance=newark"
```

**Response:**
```json
{
  "instance": "newark",
  "name": "Newark Home",
  "url": "https://rlust.ui.nabu.casa",
  "hasToken": true,
  "configured": true
}
```

### GET /api/ha/entities
```bash
curl "http://localhost:3001/api/ha/entities?instance=newark"
```

**Response:**
```json
{
  "instance": "newark",
  "configured": true,
  "lights": [...],
  "switches": [...],
  "locks": [...],
  "climate": [...],
  "cameras": [...]
}
```

### POST /api/ha/light-control
```bash
curl -X POST "http://localhost:3001/api/ha/light-control" \
  -H "Content-Type: application/json" \
  -d '{
    "instance": "newark",
    "entityId": "light.kitchen",
    "action": "on",
    "brightness": 200
  }'
```

### POST /api/ha/switch-control
```bash
curl -X POST "http://localhost:3001/api/ha/switch-control" \
  -H "Content-Type: application/json" \
  -d '{
    "instance": "newark",
    "entityId": "switch.office_fan",
    "action": "on"
  }'
```

### POST /api/ha/lock-control
```bash
curl -X POST "http://localhost:3001/api/ha/lock-control" \
  -H "Content-Type: application/json" \
  -d '{
    "instance": "newark",
    "entityId": "lock.front_door",
    "action": "lock"
  }'
```

**Actions:** "lock" or "unlock"

### POST /api/ha/climate-control
```bash
curl -X POST "http://localhost:3001/api/ha/climate-control" \
  -H "Content-Type: application/json" \
  -d '{
    "instance": "newark",
    "entityId": "climate.living_room",
    "targetTemp": 72
  }'
```

**Valid range:** 50-90°F

## Features

### Lights
- ✅ On/Off toggle
- ✅ Brightness control (0-100%)
- ✅ Real-time state tracking

### Switches
- ✅ On/Off toggle
- ✅ Real-time state tracking

### Locks
- ✅ Lock/Unlock toggle
- ✅ Visual lock status
- ✅ Safe state validation

### Climate/HVAC
- ✅ Current temperature display
- ✅ Target temperature adjustment
- ✅ ±1° incremental control
- ✅ Direct input field (50-90°F)

### General
- ✅ Instance selector (Newark/Aspire)
- ✅ Auto-refresh every 30 seconds
- ✅ Real-time connection status
- ✅ Graceful error handling
- ✅ Mock data fallback for testing

## Troubleshooting

### "Not configured (using mock data)"
**Fix:** Token not set in .env. Add `NEWARK_HA_TOKEN` and restart backend.

### Lights don't respond
**Fix:** Check token is valid in HA settings. Token may have expired.

### Can't connect to Aspire RV
**Fix:** Make sure RV is on same network (WiFi) and HA is running. Check IP address.

### Temperature won't change
**Fix:** Ensure climate entity supports temperature setting. Range must be 50-90°F.

## Future Enhancements

- [ ] Automations control
- [ ] Scene activation
- [ ] Entity history/statistics
- [ ] Custom service calls
- [ ] WebSocket for real-time updates
- [ ] Entity grouping by area
- [ ] Favorite/pinned entities

---

**Last Updated:** 2026-03-09  
**Dashboard:** http://100.78.223.120:5173  
**Backend:** http://localhost:3001
