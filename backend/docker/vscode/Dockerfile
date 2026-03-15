FROM infinityos/base:latest

ENV DEBIAN_FRONTEND=noninteractive

# Install code-server (VS Code in browser)
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Install common development tools
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    python3 \
    python3-pip \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

EXPOSE 6080
