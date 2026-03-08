#!/bin/bash
# Mission Control startup script
# Place in: ~/mission-control/scripts/start-mission-control.sh
# Make executable: chmod +x ~/mission-control/scripts/start-mission-control.sh

BASEDIR="$HOME/mission-control"
LOG_DIR="$BASEDIR/logs"
mkdir -p "$LOG_DIR"

# Function to start a service
start_service() {
    local name=$1
    local dir=$2
    local log="$LOG_DIR/${name}.log"
    
    echo "Starting $name..."
    cd "$dir" || exit 1
    npm run dev >> "$log" 2>&1 &
    echo $! > "$LOG_DIR/${name}.pid"
    echo "$name started (PID: $(cat $LOG_DIR/${name}.pid))"
}

# Start both services
start_service "backend" "$BASEDIR/backend"
start_service "frontend" "$BASEDIR/frontend"

echo "Mission Control is live!"
echo "Local: http://localhost:5173"
echo "Tailscale: http://100.78.223.120:5173"
