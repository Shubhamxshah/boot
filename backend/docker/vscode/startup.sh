#!/bin/bash
exec code-server \
    --bind-addr 0.0.0.0:8080 \
    --auth none \
    --disable-telemetry \
    /root/workspace
