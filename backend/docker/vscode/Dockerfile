FROM bootx/base:latest

ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies + common dev tools
RUN apt-get update && apt-get install -y \
    libasound2t64 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libvulkan1 \
    git \
    build-essential \
    python3 \
    python3-pip \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install VS Code (official Microsoft build)
RUN wget -O /tmp/vscode.deb \
        "https://code.visualstudio.com/sha/download?build=stable&os=linux-deb-x64" \
    && apt-get install -y /tmp/vscode.deb \
    && rm /tmp/vscode.deb

COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

EXPOSE 6080
