FROM infinityos/base:latest

ENV DEBIAN_FRONTEND=noninteractive

# Install XFCE desktop environment
RUN apt-get update && apt-get install -y \
    xfce4 \
    xfce4-terminal \
    xfce4-panel \
    xfce4-session \
    thunar \
    mousepad \
    xfce4-screenshooter \
    && rm -rf /var/lib/apt/lists/*

COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

EXPOSE 6080
