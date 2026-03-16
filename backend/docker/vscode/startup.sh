#!/bin/bash
mkdir -p /userdata/workspace /userdata/.config/vscode/User

export HOME=/userdata
export XDG_DATA_HOME=/userdata/.local/share
export XDG_CONFIG_HOME=/userdata/.config

# Write default settings on first launch only
SETTINGS=/userdata/.config/vscode/User/settings.json
if [ ! -f "$SETTINGS" ]; then
  echo '{"window.restoreWindows": "none"}' > "$SETTINGS"
fi

# Start window manager for window decorations
openbox &

exec code \
    --no-sandbox \
    --new-window \
    --user-data-dir /userdata/.config/vscode \
    /userdata/workspace
