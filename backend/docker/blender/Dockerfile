FROM infinityos/base:latest

ENV DEBIAN_FRONTEND=noninteractive
ENV BLENDER_VERSION=4.1.1

# Install dependencies
RUN apt-get update && apt-get install -y \
    xfce4 \
    libxi6 \
    libxrender1 \
    libxxf86vm1 \
    libgl1-mesa-glx \
    libglu1-mesa \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Blender
RUN wget -q "https://download.blender.org/release/Blender4.1/blender-${BLENDER_VERSION}-linux-x64.tar.xz" \
    -O /tmp/blender.tar.xz \
    && mkdir -p /opt/blender \
    && tar -xJf /tmp/blender.tar.xz -C /opt/blender --strip-components=1 \
    && rm /tmp/blender.tar.xz \
    && ln -s /opt/blender/blender /usr/local/bin/blender

COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

EXPOSE 6080
