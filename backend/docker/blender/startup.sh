#!/bin/bash
mkdir -p /userdata/blender-projects /userdata/.config
startxfce4 &
sleep 2
exec blender
