"use client";
import { useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/store/windowStore";
import { sessionsApi } from "@/lib/api/sessions";
import { useHeartbeat } from "@/lib/hooks/useHeartbeat";
import { useSession } from "@/lib/hooks/useSessions";
import type { DesktopWindow } from "@/types";

interface Props {
  window: DesktopWindow;
}

export function AppWindow({ window: win }: Props) {
  const {
    closeWindow,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowPosition,
    updateWindowSize,
    updateWindowStatus,
    focusedWindowId,
  } = useWindowStore();

  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const resizeRef = useRef({ resizing: false, startX: 0, startY: 0, origW: 0, origH: 0 });
  const isFocused = focusedWindowId === win.sessionId;

  // Poll session when loading
  const { data: sessionData } = useSession(win.status === "loading" ? win.sessionId : "");

  useEffect(() => {
    if (!sessionData?.session) return;
    const s = sessionData.session;
    if (s.status === "ready" && s.vnc_url) {
      updateWindowStatus(win.sessionId, "ready", s.vnc_url);
    } else if (s.status === "error") {
      updateWindowStatus(win.sessionId, "error");
    }
  }, [sessionData]);

  // Heartbeat when ready
  useHeartbeat(win.status === "ready" ? win.sessionId : null, win.status === "ready");

  const onTitleMouseDown = useCallback((e: React.MouseEvent) => {
    if (win.maximized) return;
    e.preventDefault();
    focusWindow(win.sessionId);
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, origX: win.x, origY: win.y };

    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.dragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      updateWindowPosition(win.sessionId, dragRef.current.origX + dx, dragRef.current.origY + dy);
    };

    const onUp = () => {
      dragRef.current.dragging = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [win.sessionId, win.x, win.y, win.maximized]);

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { resizing: true, startX: e.clientX, startY: e.clientY, origW: win.width, origH: win.height };

    const onMove = (e: MouseEvent) => {
      if (!resizeRef.current.resizing) return;
      const dx = e.clientX - resizeRef.current.startX;
      const dy = e.clientY - resizeRef.current.startY;
      updateWindowSize(
        win.sessionId,
        Math.max(400, resizeRef.current.origW + dx),
        Math.max(300, resizeRef.current.origH + dy)
      );
    };

    const onUp = () => {
      resizeRef.current.resizing = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [win.sessionId, win.width, win.height]);

  const handleClose = async () => {
    closeWindow(win.sessionId);
    try { await sessionsApi.stop(win.sessionId); } catch {}
  };

  if (win.minimized) return null;

  const style: React.CSSProperties = win.maximized
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: 0 }
    : {
        position: "absolute",
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        borderRadius: 12,
        willChange: "transform",
      };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        style={{
          ...style,
          zIndex: win.zIndex,
          border: `1px solid ${isFocused ? "#2a3f38" : "#1f2e28"}`,
          boxShadow: isFocused ? "0 20px 60px rgba(0,0,0,0.6)" : "0 8px 24px rgba(0,0,0,0.4)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={() => focusWindow(win.sessionId)}
      >
        {/* Title bar */}
        <div
          onMouseDown={onTitleMouseDown}
          className="flex items-center px-3 gap-2 shrink-0"
          style={{
            height: 36,
            background: "#111a16",
            borderBottom: "1px solid #1f2e28",
            cursor: win.maximized ? "default" : "grab",
            userSelect: "none",
          }}
        >
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); handleClose(); }}
              className="w-3 h-3 rounded-full transition-opacity hover:opacity-80"
              style={{ background: "#e05555" }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); minimizeWindow(win.sessionId); }}
              className="w-3 h-3 rounded-full transition-opacity hover:opacity-80"
              style={{ background: "#e0a855" }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); maximizeWindow(win.sessionId); }}
              className="w-3 h-3 rounded-full transition-opacity hover:opacity-80"
              style={{ background: "#55c855" }}
            />
          </div>
          <span className="text-xs text-[#6b8a7a] flex-1 text-center pr-10">{win.appName}</span>
        </div>

        {/* Content */}
        <div className="flex-1 relative" style={{ background: "#0a0f0d" }}>
          {win.status === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-[#00c896] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#6b8a7a] text-sm">Starting {win.appName}...</p>
            </div>
          )}
          {win.status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <p className="text-[#e05555] text-sm">Failed to start {win.appName}</p>
              <button
                onClick={handleClose}
                className="text-xs text-[#6b8a7a] hover:text-[#e8f0ec]"
              >
                Close
              </button>
            </div>
          )}
          {win.status === "ready" && win.vncUrl && (
            <iframe
              src={win.vncUrl}
              className="w-full h-full border-none"
              allow="clipboard-read; clipboard-write; fullscreen"
              title={win.appName}
            />
          )}
        </div>

        {/* Resize handle */}
        {!win.maximized && (
          <div
            onMouseDown={onResizeMouseDown}
            className="absolute bottom-0 right-0 w-4 h-4"
            style={{ cursor: "se-resize", zIndex: 10 }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
