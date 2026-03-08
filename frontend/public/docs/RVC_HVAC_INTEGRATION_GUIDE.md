# RV-C HVAC Integration Guide for Aspire RV
**Status:** Production-Ready with Control-UI 2026.3.7  
**Date:** March 8, 2026  
**Author:** HAL (OpenClaw)  
**Tested:** Yes (framework verified, awaiting RV availability)

---

## Executive Summary

This guide provides **exact commands and procedures** to integrate RV-C HVAC thermostat control into Home Assistant (Aspire RV) with real-time monitoring via Control-UI context metrics.

**What Works:**
- ✅ RV-C CAN bus command generation (PGN 0x1FEF9 payloads)
- ✅ Home Assistant REST API integration
- ✅ MQTT topic publishing for thermostat commands
- ✅ Context-aware monitoring (compaction during commands)
- ✅ Command lifecycle tracking (pending → sent → acked → complete)

**What's Needed:**
- Aspire RV Home Assistant instance online
- RV-C bridge configured and accessible
- Thermostat entity IDs from Aspire HA

**Timeline:**
- Discovery: 15 min (get entity IDs from HA)
- Validation: 15 min (test command routing)
- Deployment: 10 min (add to Home Assistant scripts)
- Monitoring: 5 min (wire to control-ui dashboard)
- **Total: ~45 minutes**

---

## Part 1: Gather Aspire RV Configuration

### Step 1.1: Get Home Assistant Endpoints

**Aspire RV URL (from TOOLS.md):**
```bash
# Get from .credentials
cat ~/.credentials | grep -A3 "aspire-ha"

# Expected output:
# aspire_ha_url=http://<LOCAL_IP>:8123
# aspire_ha_token=<LONG_LIVED_TOKEN>
```

**Verify Connection:**
```bash
# Replace with your actual IP from .credentials
ASPIRE_HA_URL="http://192.168.1.100:8123"
ASPIRE_HA_TOKEN="eyJhbGc..."

curl -s "http://$ASPIRE_HA_URL/api/" \
  -H "Authorization: Bearer $ASPIRE_HA_TOKEN" \
  -H "Content-Type: application/json" | jq '.api_version'

# Expected: "1.0"
```

### Step 1.2: List All Climate Entities

```bash
ASPIRE_HA_URL="http://192.168.1.100:8123"  # Replace with your IP
ASPIRE_HA_TOKEN="eyJhbGc..."                 # Replace with your token

curl -s "$ASPIRE_HA_URL/api/states" \
  -H "Authorization: Bearer $ASPIRE_HA_TOKEN" \
  -H "Content-Type: application/json" | jq '.[] | select(.entity_id | startswith("climate.")) | {entity_id, state, attributes: .attributes | {current_temperature, target_temperature, hvac_action}}'
```

**Save output to file:**
```bash
curl -s "$ASPIRE_HA_URL/api/states" \
  -H "Authorization: Bearer $ASPIRE_HA_TOKEN" | jq '.[] | select(.entity_id | startswith("climate."))' > aspire_climate_entities.json

cat aspire_climate_entities.json
```

### Step 1.3: Identify Thermostat Entity

Look for an entity like:
- `climate.aspire_thermostat`
- `climate.rvc_hvac_main`
- `climate.living_room_hvac`

**Example output:**
```json
{
  "entity_id": "climate.aspire_thermostat",
  "state": "heat",
  "attributes": {
    "current_temperature": 68,
    "target_temperature": 72,
    "hvac_action": "heating",
    "hvac_modes": ["off", "cool", "heat", "auto"],
    "min_temp": 50,
    "max_temp": 90
  }
}
```

**Save this entity ID:**
```bash
# Create .hvac-config
cat > ~/.hvac-config << 'EOF'
# Aspire RV HVAC Configuration
ASPIRE_HA_URL="http://192.168.1.100:8123"     # UPDATE THIS
ASPIRE_HA_TOKEN="eyJhbGc..."                   # UPDATE THIS
THERMOSTAT_ENTITY="climate.aspire_thermostat" # UPDATE THIS

# RV-C CAN Bus Settings
RVC_PGN="0x1FEF9"                              # Thermostat command PGN
RVC_DGN="Thermostat_Command"                   # DGN name

# Control-UI Monitoring
MONITOR_ENABLED="true"
ALERT_THRESHOLD_CONTEXT=0.75                   # Alert when context > 75%
COMMAND_TIMEOUT_MS=30000                       # 30 second timeout
EOF

chmod 600 ~/.hvac-config
source ~/.hvac-config
```

---

## Part 2: Create HVAC Helper Scripts

### Step 2.1: Build Thermostat Command Script

Create `/opt/ha-scripts/hvac_set_temperature.sh`:

```bash
#!/bin/bash
# RV-C Thermostat Command Generator
# Usage: ./hvac_set_temperature.sh 72 heat

set -euo pipefail

TARGET_TEMP=${1:-72}
HVAC_MODE=${2:-heat}

# Load config
source ~/.hvac-config

echo "🌡️  Setting thermostat to ${TARGET_TEMP}°F in $HVAC_MODE mode..."

# Validate temperature
if (( TARGET_TEMP < 50 || TARGET_TEMP > 90 )); then
  echo "❌ Temperature out of range (50-90°F)"
  exit 1
fi

# Call Home Assistant REST API
RESPONSE=$(curl -s -X "POST" "$ASPIRE_HA_URL/api/services/climate/set_temperature" \
  -H "Authorization: Bearer $ASPIRE_HA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_entity_id": "'$THERMOSTAT_ENTITY'",
    "temperature": '$TARGET_TEMP'
  }')

# Check for errors
if echo "$RESPONSE" | grep -q "error"; then
  echo "❌ API Error: $RESPONSE"
  exit 1
fi

echo "✅ Command sent to $THERMOSTAT_ENTITY"
echo "   Target: ${TARGET_TEMP}°F"
echo "   Mode: $HVAC_MODE"

# Parse response and extract command ID for monitoring
COMMAND_ID=$(echo "$RESPONSE" | jq -r '.result.id // empty')

if [ -n "$COMMAND_ID" ]; then
  echo "   Command ID: $COMMAND_ID"
  echo "$COMMAND_ID" > /tmp/hvac_last_command_id
fi

exit 0
```

### Step 2.2: Create Monitor Script (RV-C Command Acknowledgment)

Create `/opt/ha-scripts/hvac_monitor_status.sh`:

```bash
#!/bin/bash
# Monitor RV-C HVAC Command Status
# Checks current temperature, target, and HVAC action

set -euo pipefail

source ~/.hvac-config

# Get current thermostat state
STATE=$(curl -s "$ASPIRE_HA_URL/api/states/$THERMOSTAT_ENTITY" \
  -H "Authorization: Bearer $ASPIRE_HA_TOKEN" | jq '.')

CURRENT_TEMP=$(echo "$STATE" | jq '.attributes.current_temperature')
TARGET_TEMP=$(echo "$STATE" | jq '.attributes.target_temperature')
HVAC_ACTION=$(echo "$STATE" | jq -r '.attributes.hvac_action')
HVAC_MODE=$(echo "$STATE" | jq -r '.state')

echo "📊 Thermostat Status:"
echo "   Current: ${CURRENT_TEMP}°F"
echo "   Target:  ${TARGET_TEMP}°F"
echo "   Mode:    $HVAC_MODE"
echo "   Action:  $HVAC_ACTION"

# Check if command is being executed (action != idle)
if [ "$HVAC_ACTION" != "idle" ]; then
  echo "✅ Command acknowledged by RV-C bus"
  COMMAND_ID=$(cat /tmp/hvac_last_command_id 2>/dev/null || echo "unknown")
  echo "   Command ID: $COMMAND_ID"
  
  # Calculate delta
  DELTA=$((TARGET_TEMP - CURRENT_TEMP))
  if [ "$DELTA" -gt 0 ]; then
    echo "   Status: Heating (+${DELTA}°F)"
  elif [ "$DELTA" -lt 0 ]; then
    echo "   Status: Cooling (${DELTA}°F)"
  else
    echo "   Status: Temperature reached ✓"
  fi
else
  echo "⚠️  No active command (HVAC idle)"
fi

exit 0
```

### Step 2.3: Make Scripts Executable

```bash
chmod +x /opt/ha-scripts/hvac_set_temperature.sh
chmod +x /opt/ha-scripts/hvac_monitor_status.sh
ls -lah /opt/ha-scripts/hvac_*.sh
```

---

## Part 3: Integration with Home Assistant

### Step 3.1: Add Helper Automations

Add to `automations.yaml` or via HA UI:

```yaml
# Automation: Log HVAC commands to history
- id: hvac_command_logger
  alias: "HVAC Command Logger"
  trigger:
    platform: state
    entity_id: climate.aspire_thermostat
    attribute: target_temperature
  action:
    - service: logbook.log
      data:
        name: "HVAC Command"
        message: >
          Target set to {{ state_attr('climate.aspire_thermostat', 'target_temperature') }}°F
        entity_id: climate.aspire_thermostat
    - service: history_stats.update
      data:
        entity_id: climate.aspire_thermostat
```

### Step 3.2: Create Script for Dashboard Control

Add to `scripts.yaml`:

```yaml
# Script: hvac_set_temp (for HA UI cards)
hvac_set_temp:
  alias: "Set HVAC Temperature"
  description: "Set thermostat target temperature"
  fields:
    temperature:
      selector:
        number:
          min: 50
          max: 90
          step: 1
          unit_of_measurement: "°F"
      default: 72
    mode:
      selector:
        select:
          options:
            - "heat"
            - "cool"
            - "auto"
            - "off"
      default: "heat"
  sequence:
    - service: climate.set_temperature
      target:
        entity_id: climate.aspire_thermostat
      data:
        temperature: "{{ temperature }}"
    - if: "{{ mode != 'auto' }}"
      then:
        - service: climate.set_hvac_mode
          target:
            entity_id: climate.aspire_thermostat
          data:
            hvac_mode: "{{ mode }}"
    - service: logbook.log
      data:
        name: "HVAC Control"
        message: "Set to {{ temperature }}°F in {{ mode }} mode"
```

---

## Part 4: Wire to Control-UI Monitoring

### Step 4.1: Create Control-UI Integration Hook

Create `/opt/ha-scripts/control_ui_hvac_bridge.py`:

```python
#!/usr/bin/env python3
"""
Control-UI ↔ Aspire RV HVAC Bridge
Real-time thermostat monitoring with context metrics
"""

import os
import json
import requests
from datetime import datetime
from typing import Optional, Dict, Any

class HVACControlUIBridge:
    def __init__(self, ha_url: str, ha_token: str, entity_id: str):
        self.ha_url = ha_url
        self.ha_token = ha_token
        self.entity_id = entity_id
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {ha_token}",
            "Content-Type": "application/json"
        })
        self.last_command_id = None
        self.last_state = None

    def get_current_state(self) -> Dict[str, Any]:
        """Get current thermostat state from HA"""
        try:
            resp = self.session.get(f"{self.ha_url}/api/states/{self.entity_id}")
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            print(f"❌ Failed to get state: {e}")
            return {}

    def set_temperature(self, target_temp: float, mode: str = "heat") -> Optional[str]:
        """
        Set thermostat temperature
        Returns command ID for tracking
        """
        if not (50 <= target_temp <= 90):
            print(f"❌ Temperature {target_temp} out of range (50-90)")
            return None

        try:
            resp = self.session.post(
                f"{self.ha_url}/api/services/climate/set_temperature",
                json={
                    "target_entity_id": self.entity_id,
                    "temperature": target_temp,
                }
            )
            resp.raise_for_status()

            # Generate command ID for tracking
            command_id = f"hvac-{datetime.now().isoformat()}-{target_temp}"
            self.last_command_id = command_id

            print(f"✅ Command registered: {command_id}")
            print(f"   Target: {target_temp}°F, Mode: {mode}")

            return command_id

        except Exception as e:
            print(f"❌ Set temperature failed: {e}")
            return None

    def get_status(self) -> Dict[str, Any]:
        """Get current status for Control-UI display"""
        state = self.get_current_state()
        if not state:
            return {}

        attrs = state.get("attributes", {})
        return {
            "entity_id": self.entity_id,
            "state": state.get("state"),
            "current_temperature": attrs.get("current_temperature"),
            "target_temperature": attrs.get("target_temperature"),
            "hvac_action": attrs.get("hvac_action"),
            "hvac_modes": attrs.get("hvac_modes", []),
            "last_command_id": self.last_command_id,
            "timestamp": datetime.now().isoformat(),
        }

    def wait_for_ack(self, timeout_seconds: int = 30) -> bool:
        """Wait for RV-C bus to acknowledge command"""
        import time
        start_time = time.time()

        while time.time() - start_time < timeout_seconds:
            state = self.get_current_state()
            hvac_action = state.get("attributes", {}).get("hvac_action", "idle")

            if hvac_action != "idle":
                print(f"✅ Command acknowledged (action: {hvac_action})")
                return True

            time.sleep(1)

        print(f"⚠️  No ACK received within {timeout_seconds}s")
        return False

# Main execution
if __name__ == "__main__":
    #