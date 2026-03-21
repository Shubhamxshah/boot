FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

RUN apt-get update && apt-get install -y \
    supervisor \
    x11vnc \
    xvfb \
    websockify \
    openbox \
    xterm \
    wget \
    curl \
    ca-certificates \
    dbus-x11 \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

# noVNC setup - install from source to avoid version mismatch with dragThreshold
RUN wget -q https://github.com/novnc/noVNC/archive/refs/tags/v1.5.0.tar.gz -O /tmp/novnc.tar.gz \
    && mkdir -p /usr/share/novnc \
    && tar -xzf /tmp/novnc.tar.gz -C /usr/share/novnc --strip-components=1 \
    && rm /tmp/novnc.tar.gz \
    && ln -s /usr/share/novnc/vnc.html /usr/share/novnc/index.html 2>/dev/null || true

ENV DISPLAY=:1
ENV VNC_PORT=5900
ENV NOVNC_PORT=6080
ENV RESOLUTION=1280x800x24

EXPOSE 6080

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
