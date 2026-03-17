"use client";
import { useEffect, useRef } from "react";
import { filesApi } from "@/lib/api/files";

export function TerminalContent({ sessionId }: { sessionId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const termRef = useRef<import("@xterm/xterm").Terminal | null>(null);
  const fitRef = useRef<import("@xterm/addon-fit").FitAddon | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    async function init() {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      if (destroyed || !containerRef.current) return;

      const term = new Terminal({
        theme: {
          background: "#0a0f0d",
          foreground: "#c8d8d0",
          cursor: "#00c896",
          selectionBackground: "rgba(0,200,150,0.3)",
          black: "#0a0f0d",
          red: "#e05555",
          green: "#00c896",
          yellow: "#e0a855",
          blue: "#5588bb",
          magenta: "#aa77cc",
          cyan: "#00b8aa",
          white: "#c8d8d0",
          brightBlack: "#3a5040",
          brightRed: "#ff7070",
          brightGreen: "#33ddbb",
          brightYellow: "#ffc966",
          brightBlue: "#88aadd",
          brightMagenta: "#cc99ee",
          brightCyan: "#33cccc",
          brightWhite: "#e8f0ec",
        },
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        fontSize: 13,
        lineHeight: 1.4,
        cursorBlink: true,
        allowProposedApi: true,
      });

      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(containerRef.current!);
      fit.fit();

      termRef.current = term;
      fitRef.current = fit;

      // Connect WebSocket
      const wsUrl = filesApi.wsUrl(sessionId);
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        // Send initial size
        ws.send(
          JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows })
        );
      };

      ws.onmessage = (e) => {
        if (e.data instanceof ArrayBuffer) {
          term.write(new Uint8Array(e.data));
        } else {
          term.write(e.data);
        }
      };

      ws.onclose = () => {
        if (!destroyed) term.write("\r\n\x1b[31m[connection closed]\x1b[0m\r\n");
      };

      ws.onerror = () => {
        if (!destroyed) term.write("\r\n\x1b[31m[connection error]\x1b[0m\r\n");
      };

      // Terminal input → WebSocket
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(new TextEncoder().encode(data));
        }
      });

      // Handle resize
      const observer = new ResizeObserver(() => {
        fit.fit();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows })
          );
        }
      });
      if (containerRef.current) observer.observe(containerRef.current);

      return () => observer.disconnect();
    }

    const cleanup = init();

    return () => {
      destroyed = true;
      cleanup.then((fn) => fn?.());
      wsRef.current?.close();
      termRef.current?.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "#0a0f0d", padding: 4 }}
    />
  );
}
