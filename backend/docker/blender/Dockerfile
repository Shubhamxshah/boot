FROM bootx/base:latest

ENV DEBIAN_FRONTEND=noninteractive
ENV BLENDER_VERSION=4.4.0

# Install dependencies
RUN apt-get update && apt-get install -y \
    xfce4 \
    libxi6 \
    libxrender1 \
    libxxf86vm1 \
    libgl1 \
    libglu1-mesa \
    wget \
    xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Blender
RUN wget -q "https://download.blender.org/release/Blender4.4/blender-${BLENDER_VERSION}-linux-x64.tar.xz" \
    -O /tmp/blender.tar.xz \
    && mkdir -p /opt/blender \
    && tar -xJf /tmp/blender.tar.xz -C /opt/blender --strip-components=1 \
    && rm /tmp/blender.tar.xz \
    && ln -s /opt/blender/blender /usr/local/bin/blender

COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

EXPOSE 6080
