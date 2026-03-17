import { apiClient } from "./client";

export interface FileEntry {
  name: string;
  is_dir: boolean;
  size: number;
  mod_time: string;
  path: string;
}

export const filesApi = {
  list: (path = "/") =>
    apiClient.get<{ files: FileEntry[]; path: string }>(
      `/files?path=${encodeURIComponent(path)}`
    ),

  mkdir: (path: string) =>
    apiClient.post<{ message: string }>("/files/mkdir", { path }),

  delete: (path: string) =>
    apiClient.delete<{ message: string }>(
      `/files?path=${encodeURIComponent(path)}`
    ),

  rename: (from: string, to: string) =>
    apiClient.post<{ message: string }>("/files/rename", { from, to }),

  download: async (path: string, name: string) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : "";
    const base =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const res = await fetch(
      `${base}/files/download?path=${encodeURIComponent(path)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  },

  upload: async (path: string, file: File) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : "";
    const base =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(
      `${base}/files/upload?path=${encodeURIComponent(path)}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      }
    );
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  },

  wsUrl: (sessionId: string) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : "";
    const base =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const wsBase = base.replace(/^http/, "ws");
    return `${wsBase}/terminal/ws?token=${token}&session_id=${sessionId}`;
  },
};
