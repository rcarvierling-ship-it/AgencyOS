#!/usr/bin/env bash
# Installs the mockup worker as a background service so builds start on their
# own. AgencyOS runs on Vercel and cannot reach Claude Code on this machine, so
# something here has to watch the queue — this makes that automatic and
# survives logout and reboot.
#
#   ./tools/install-worker.sh            install and start
#   ./tools/install-worker.sh --status   show state and recent log
#   ./tools/install-worker.sh --stop     stop and remove
set -euo pipefail

LABEL="com.rcvagency.agencyos-worker"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/agencyos-worker.log"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

case "${1:-install}" in
  --status)
    launchctl list | grep -q "$LABEL" && echo "running" || echo "not running"
    echo "--- last 25 log lines ($LOG) ---"
    tail -n 25 "$LOG" 2>/dev/null || echo "(no log yet)"
    exit 0 ;;
  --stop)
    launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || launchctl unload "$PLIST" 2>/dev/null || true
    rm -f "$PLIST"
    echo "stopped and removed"
    exit 0 ;;
esac

NODE_BIN="$(command -v node)"
CLAUDE_BIN="$(command -v claude || true)"
[ -z "$CLAUDE_BIN" ] && { echo "claude CLI not found on PATH. Install Claude Code first."; exit 1; }

# The token lives in the repo's .env.local, pulled from Vercel.
TOKEN="${AGENT_API_TOKEN:-$(grep -m1 '^AGENT_API_TOKEN=' "$REPO/.env.local" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)}"
if [ -z "$TOKEN" ]; then
  echo "AGENT_API_TOKEN not found."
  echo "Run:  cd $REPO && vercel env pull .env.local --environment=production"
  echo "or export AGENT_API_TOKEN before running this."
  exit 1
fi

URL="${AGENCYOS_URL:-https://www.rcvagency.com}"
mkdir -p "$HOME/Library/LaunchAgents" "$(dirname "$LOG")"

cat > "$PLIST" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE_BIN</string>
    <string>$REPO/tools/demo-worker.mjs</string>
    <string>--watch</string>
    <string>--url</string><string>$URL</string>
    <string>--interval</string><string>15</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>AGENT_API_TOKEN</key><string>$TOKEN</string>
    <key>AGENT_NAME</key><string>$(scutil --get ComputerName 2>/dev/null || echo mac)</string>
    <key>HOME</key><string>$HOME</string>
    <key>PATH</key><string>$(dirname "$NODE_BIN"):$(dirname "$CLAUDE_BIN"):/usr/local/bin:/usr/bin:/bin</string>
  </dict>
  <key>WorkingDirectory</key><string>$REPO</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
PLIST_EOF

chmod 600 "$PLIST"   # the plist carries the agent token
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

echo "Installed and started."
echo "  watching : $URL"
echo "  log      : $LOG"
echo "  status   : ./tools/install-worker.sh --status"
echo "  stop     : ./tools/install-worker.sh --stop"
