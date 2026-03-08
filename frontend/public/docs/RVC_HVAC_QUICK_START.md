# RV-C HVAC Quick Start — 5 Minute Setup

**Status:** Ready to deploy  
**Required:** Aspire RV online, entity IDs known  
**Time:** 5-10 minutes

---

## ⚡ Fastest Path to Working HVAC Control

### 1. Get Configuration (2 min)

```bash
# Fetch from Aspire RV Home Assistant
ASPIRE_IP="192.168.1.100"  # ← UPDATE THIS
ASPIRE_TOKEN="eyJhbGc..."  # ← UPDATE THIS (from HA settings)

# Save to file for reuse
cat > ~/.hvac-config << EOF
ASPIRE_HA_URL="http://$ASPIRE_IP:8123"
ASPIRE_HA_TOKEN="$ASPIRE_TOKEN"
THERMOSTAT_ENTITY="climate.aspire_thermostat"
EOF

source ~/.hvac-config
```

### 2. Verify Connection (1 min)

```bash
# Test API access
curl -s "$ASPIRE_HA_URL/api/" \
  -H "Authorization: Bearer $ASPIRE_HA_TOKEN" | jq '.api_version'

# Should return: "1.0"
```

### 3. List Thermostats (1 min)

```bash
# Find all climate entities
curl -s "$ASPIRE_HA_URL/api/states" \
  -H "Authorization: Bearer $ASPIRE_HA_TOKEN" | \
  jq -r '.[] | select(.entity_id | startswith("climate.")) | .entity_id'

# Pick the right one and update ~/.hvac-config
```

### 4. Test Command (1 min)

```bash
# Set temperature to 72°F
curl -X POST "$ASPIRE_HA_URL/api/services/climate/set_temperature" \
  -H "Authorization: Bearer $ASPIRE_HA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_entity_id": "'$THERMOSTAT_ENTITY'",
    "temperature": 72
  }' | jq '.'

# Expected: {success: true} or empty {}
```

### 5. Check Status (instant)

```bash
# Get current thermostat state
curl -s "$ASPIRE_HA_URL/api/states/$THERMOSTAT_ENTITY" \
  -H "Authorization: Bearer $ASPIRE_HA_TOKEN" | \
  jq '.attributes | {current_temperature, target_temperature, hvac_action}'

# Should show:
# {
#   "current_temperature": 68,
#   "target_temperature": 72,
#   "hvac_action": "heating"
# }
```

---

## 🔧 One-Liner Commands

### Set to 70°F (heating)
```bash
source ~/.hvac-config && curl -X POST "$ASPIRE_HA_URL/api/services/climate/set_temperature" -H "Authorization: Bearer $ASPIRE_HA_TOKEN" -H "Content-Type: application/json" -d '{"target_entity_id":"'$THERMOSTAT_ENTITY'","temperature":70}' && echo "✅ Set to 70°F"
```

### Set to 75°F (heating)
```bash
source ~/.hvac-config && curl -X POST "$ASPIRE_HA_URL/api/services/climate/set_temperature" -H "Authorization: Bearer $ASPIRE_HA_TOKEN" -H "Content-Type: application/json" -d '{"target_entity_id":"'$THERMOSTAT_ENTITY'","temperature":75}' && echo "✅ Set to 75°F"
```

### Get Current Status
```bash
source ~/.hvac-config && curl -s "$ASPIRE_HA_URL/api/states/$THERMOSTAT_ENTITY" -H "Authorization: Bearer $ASPIRE_HA_TOKEN" | jq '.attributes | {current_temperature, target_temperature, hvac_action, hvac_modes: .hvac_modes}'
```

### Set Mode to Cool
```bash
source ~/.hvac-config && curl -X POST "$ASPIRE_HA_URL/api/services/climate/set_hvac_mode" -H "Authorization: Bearer $ASPIRE_HA_TOKEN" -H "Content-Type: application/json" -d '{"entity_id":"'$THERMOSTAT_ENTITY'","hvac_mode":"cool"}' && echo "✅ Set to cool mode"
```

### Set Mode to Off
```bash
source ~/.hvac-config && curl -X POST "$ASPIRE_HA_URL/api/services/climate/set_hvac_mode" -H "Authorization: Bearer $ASPIRE_HA_TOKEN" -H "Content-Type: application/json" -d '{"entity_id":"'$THERMOSTAT_ENTITY'","hvac_mode":"off"}' && echo "✅ Set to off"
```

---

## 🎯 Integration with Control-UI

### Register Command with Monitor

```bash
# In your control-ui code (TypeScript/Vue 3):

import { HVACCommandMonitor } from 'control-ui/src/integrations/hvacCommandMonitor'

// Create monitor instance
const hvacMonitor = HVACCommandMonitor.createFromControlUI(contextMetrics)

// Before sending command:
const cmdId = hvacMonitor.registerCommand({
  command: 'SET_TEMP',
  targetTemp: 72,
  pgn: '0x1FEF9',
  dgn: 'Thermostat_Command'
})

// Send via API (as above)
fetch('...set_temperature...', {...})

// Mark as sent
hvacMonitor.markSent(cmdId)

// When RV-C bus acknowledges (hvac_action != 'idle')
hvacMonitor.markAcked(cmdId)

// Get stats
const stats = hvacMonitor.getStats(cmdId)
console.log(`Command took ${stats.durationMs}ms, avg context: ${(stats.avgContextUsage * 100).toFixed(0)}%`)
```

### Monitor via Telegram Alerts

```bash
# In control-ui app.vue or composable:

import { createCriticalAlertBridge } from 'control-ui/src/integrations/telegramAlertBridge'

const controlUi = useControlUiStore()

// Enable critical alerts (errors only)
createCriticalAlertBridge(controlUi.alerts)

// Now context-high and command-failed alerts auto-send to Telegram
```

---

## 📋 Deployment Checklist

- [ ] Aspire RV is online and accessible
- [ ] Home Assistant token obtained from HA settings
- [ ] Thermostat entity ID identified (e.g., `climate.aspire_thermostat`)
- [ ] `~/.hvac-config` created and tested
- [ ] One test command executed successfully
- [ ] Status check shows correct temperatures
- [ ] Control-UI import working in dashboard code
- [ ] HVACCommandMonitor instantiated
- [ ] Telegram bridge enabled for alerts
- [ ] HVAC monitor wired to context metrics

---

## ⚠️ Troubleshooting

### Connection Refused
```bash
# Check Aspire RV IP is correct
ping $ASPIRE_IP

# Check port 8123 is open
nc -zv $ASPIRE_IP 8123

# If closed, check HA is running on Aspire RV
```

### "Invalid token" error
```bash
# Regenerate long-lived token in HA:
# Settings → Devices & Services → Developer Tools → Create Long-Lived Access Token
# Copy new token to ~/.hvac-config
```

### Command sent but no change
```bash
# Check if thermostat is in manual override
curl -s "$ASPIRE_HA_URL/api/states/$THERMOSTAT_ENTITY" \
  -H "Authorization: Bearer $ASPIRE_HA_TOKEN" | jq '.attributes'

# Look for "manual_override" or "lock" attributes

# If thermostat is locked, unlock first via HA UI
```

### HVAC Action stays "idle"
```bash
# Check RV-C bridge is running
ssh aspire-rv "systemctl status rvc-bridge"

# Check MQTT is connected
ssh aspire-rv "mosquitto_sub -t 'rvc/+/thermostat/command' -n 1"

# If no messages, restart bridge
ssh aspire-rv "systemctl restart rvc-bridge"
```

---

## 🚀 Ready to Go!

**Test the simplest command first:**
```bash
source ~/.hvac-config && \
curl -s "$ASPIRE_HA_URL/api/states/$THERMOSTAT_ENTITY" \
  -H "Authorization: Bearer $ASPIRE_HA_TOKEN" | jq '.attributes.current_temperature'
```

If that works, you're connected. The integration is ready.

**Next:** Wire Control-UI monitor into your dashboard for real-time tracking.
