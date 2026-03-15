import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export function getAppIcon(appId: string): string {
  const icons: Record<string, string> = {
    vscode: "⚡",
    blender: "🎨",
    gazebo: "🤖",
    ubuntu: "🖥️",
  };
  return icons[appId] || "📦";
}

export function getAppColor(appId: string): string {
  const colors: Record<string, string> = {
    vscode: "#007ACC",
    blender: "#EA7600",
    gazebo: "#6B4FBB",
    ubuntu: "#E95420",
  };
  return colors[appId] || "#00c896";
}
