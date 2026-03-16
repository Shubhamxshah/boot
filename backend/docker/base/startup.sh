#!/bin/bash
# Base startup script — overridden by child images
set -e
if [ -d "/userdata" ]; then
    mkdir -p /userdata/.config /userdata/workspace /userdata/blender-projects /userdata/downloads
    # Symlink ~/.config → /userdata/.config so all app configs persist
    if [ -d "$HOME/.config" ] && [ ! -L "$HOME/.config" ]; then
        cp -rn "$HOME/.config/." /userdata/.config/ 2>/dev/null || true
        rm -rf "$HOME/.config"
    fi
    ln -sfn /userdata/.config "$HOME/.config"
fi
exec /bin/bash
