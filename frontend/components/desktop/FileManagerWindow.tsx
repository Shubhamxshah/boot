"use client";
import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Folder,
  File,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RefreshCw,
  Upload,
  FolderPlus,
  Trash2,
  Download,
  Home,
  LayoutGrid,
  List,
  HardDrive,
  Star,
  Clock,
  PackageOpen,
} from "lucide-react";
import { filesApi, FileEntry } from "@/lib/api/files";

interface Favorite {
  path: string;
  name: string;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function FileManagerContent() {
  const [driveView, setDriveView] = useState(true);
  const [trashView, setTrashView] = useState(false);
  const [path, setPath] = useState("/");
  const [history, setHistory] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderSubmittingRef = useRef(false);
  const qc = useQueryClient();

  const toggleFavorite = (entry: FileEntry) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.path === entry.path);
      if (exists) return prev.filter((f) => f.path !== entry.path);
      return [...prev, { path: entry.path, name: entry.name }];
    });
  };

  const isFavorite = (entryPath: string) => favorites.some((f) => f.path === entryPath);

  const openTrash = () => {
    setTrashView(true);
    setDriveView(false);
    setSelected(null);
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["files", path],
    queryFn: () => filesApi.list(path),
    enabled: !driveView && !trashView,
  });

  const files = data?.files ?? [];
  const sortedFiles = [...files]
    .filter((f) => !f.name.startsWith("."))
    .sort((a, b) => {
      if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const enterFiles = useCallback(() => {
    setDriveView(false);
    setTrashView(false);
    setPath("/");
    setHistory([]);
    setFuture([]);
    setSelected(null);
  }, []);

  const navigate = useCallback(
    (newPath: string) => {
      setHistory((h) => [...h, path]);
      setFuture([]);
      setPath(newPath);
      setDriveView(false);
      setTrashView(false);
      setSelected(null);
    },
    [path]
  );

  const goBack = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setFuture((f) => [path, ...f]);
    setHistory((h) => h.slice(0, -1));
    setPath(prev);
    setDriveView(false);
    setTrashView(false);
    setSelected(null);
  };

  const goForward = () => {
    if (!future.length) return;
    const next = future[0];
    setHistory((h) => [...h, path]);
    setFuture((f) => f.slice(1));
    setPath(next);
    setDriveView(false);
    setTrashView(false);
    setSelected(null);
  };

  const goUp = () => {
    if (trashView) {
      setTrashView(false);
      setDriveView(true);
      setSelected(null);
      return;
    }
    if (path === "/") {
      setDriveView(true);
      setHistory([]);
      setFuture([]);
      setSelected(null);
      return;
    }
    const parent = path.substring(0, path.lastIndexOf("/")) || "/";
    navigate(parent);
  };

  const deleteMutation = useMutation({
    mutationFn: (p: string) => filesApi.delete(p),
    onSuccess: () => {
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["files", path] });
    },
  });

  const mkdirMutation = useMutation({
    mutationFn: (p: string) => filesApi.mkdir(p),
    onSuccess: () => {
      setCreatingFolder(false);
      setNewFolderName("");
      qc.invalidateQueries({ queryKey: ["files", path] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) =>
      filesApi.rename(from, to),
    onSuccess: () => {
      setRenaming(null);
      setNewName("");
      qc.invalidateQueries({ queryKey: ["files", path] });
    },
  });

  const handleDoubleClick = (entry: FileEntry) => {
    if (entry.is_dir) {
      navigate(entry.path);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    try {
      await filesApi.upload(path, file);
      qc.invalidateQueries({ queryKey: ["files", path] });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      e.target.value = "";
    }
  };

  const commitRename = (entry: FileEntry) => {
    if (!newName.trim() || newName === entry.name) {
      setRenaming(null);
      return;
    }
    const dir = entry.path.substring(0, entry.path.lastIndexOf("/")) || "/";
    renameMutation.mutate({ from: entry.path, to: `${dir}/${newName.trim()}` });
  };

  const commitNewFolder = () => {
    if (folderSubmittingRef.current) return;
    if (!newFolderName.trim()) {
      setCreatingFolder(false);
      return;
    }
    folderSubmittingRef.current = true;
    const folderPath =
      path === "/" ? `/${newFolderName.trim()}` : `${path}/${newFolderName.trim()}`;
    mkdirMutation.mutate(folderPath, {
      onSettled: () => {
        folderSubmittingRef.current = false;
      },
    });
  };

  const selectedEntry = selected ? files.find((f) => f.path === selected) : null;
  const pathParts = path === "/" ? [""] : path.split("/");
  const recentPaths = history.slice(-5).reverse();

  return (
    <div
      className="flex h-full"
      style={{
        background: "rgba(8,14,10,0.85)",
        backdropFilter: "blur(28px)",
        color: "#c8d8d0",
        fontSize: 13,
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <div
        className="flex flex-col shrink-0 overflow-y-auto py-2"
        style={{
          width: 210,
          background: "rgba(0,0,0,0.28)",
          borderRight: "1px solid rgba(255,255,255,0.055)",
        }}
      >
        {/* Explorer */}
        <SidebarSection title="Explorer">
          <SidebarItem
            icon={<HardDrive size={15} />}
            label="files"
            active={driveView && !trashView}
            onClick={() => { setDriveView(true); setTrashView(false); }}
          />
          <SidebarItem
            icon={<Home size={15} />}
            label="Home"
            active={driveView && !trashView}
            onClick={() => { setDriveView(true); setTrashView(false); }}
          />
          <SidebarItem
            icon={<Trash2 size={15} />}
            label="Trash"
            active={trashView}
            danger
            onClick={openTrash}
          />
        </SidebarSection>

        {/* Favorites */}
        <SidebarSection title="Favorites">
          {favorites.length === 0 ? (
            <SidebarItem icon={<Star size={15} />} label="Star a folder to pin it" muted />
          ) : (
            favorites.map((fav) => (
              <SidebarItem
                key={fav.path}
                icon={<Star size={14} />}
                label={fav.name}
                active={!driveView && !trashView && path === fav.path}
                onClick={() => navigate(fav.path)}
              />
            ))
          )}
        </SidebarSection>

        {/* Recent */}
        <SidebarSection title="Recent">
          {recentPaths.length === 0 ? (
            <SidebarItem icon={<Clock size={15} />} label="Nothing yet" muted />
          ) : (
            recentPaths.map((p) => (
              <SidebarItem
                key={p}
                icon={<Folder size={14} />}
                label={p === "/" ? "Root" : (p.split("/").pop() ?? p)}
                active={!driveView && !trashView && path === p}
                onClick={() => navigate(p)}
              />
            ))
          )}
        </SidebarSection>
      </div>

      {/* ── Main area ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div
          className="flex items-center gap-0.5 px-2 shrink-0"
          style={{
            height: 42,
            background: "rgba(0,0,0,0.18)",
            borderBottom: "1px solid rgba(255,255,255,0.055)",
          }}
        >
          <ToolBtn onClick={goBack} disabled={!history.length} title="Back">
            <ArrowLeft size={14} />
          </ToolBtn>
          <ToolBtn onClick={goForward} disabled={!future.length} title="Forward">
            <ArrowRight size={14} />
          </ToolBtn>
          <ToolBtn onClick={goUp} disabled={driveView && !trashView} title="Up">
            <ArrowUp size={14} />
          </ToolBtn>
          <ToolBtn onClick={() => refetch()} title="Refresh" disabled={driveView || trashView}>
            <RefreshCw size={14} />
          </ToolBtn>

          {/* Breadcrumb */}
          <div
            className="flex-1 flex items-center gap-1 px-3 mx-2 rounded-md overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              height: 28,
              fontSize: 12,
            }}
          >
            {driveView ? (
              <span style={{ color: "#c8d8d0" }}>files</span>
            ) : trashView ? (
              <>
                <button
                  onClick={() => { setDriveView(true); setTrashView(false); }}
                  className="transition-colors shrink-0 hover:text-[#00c896]"
                  style={{ color: "#4a6858" }}
                >
                  files
                </button>
                <span style={{ color: "#2a3830" }}>/</span>
                <span style={{ color: "#c8d8d0" }}>Trash</span>
              </>
            ) : (
              <>
                <button
                  onClick={() => setDriveView(true)}
                  className="transition-colors shrink-0 hover:text-[#00c896]"
                  style={{ color: "#4a6858" }}
                >
                  files
                </button>
                {pathParts.filter(Boolean).map((part, i, arr) => {
                  const segPath = "/" + arr.slice(0, i + 1).join("/");
                  return (
                    <span key={i} className="flex items-center gap-1 shrink-0">
                      <span style={{ color: "#2a3830" }}>/</span>
                      <button
                        onClick={() => navigate(segPath)}
                        className="transition-colors hover:text-[#00c896]"
                        style={{ color: i === arr.length - 1 ? "#c8d8d0" : "#4a6858" }}
                      >
                        {part}
                      </button>
                    </span>
                  );
                })}
              </>
            )}
          </div>

          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.07)", margin: "0 3px" }} />

          <ToolBtn onClick={() => fileInputRef.current?.click()} title="Upload file" disabled={driveView || trashView}>
            <Upload size={14} />
          </ToolBtn>
          <ToolBtn
            onClick={() => setCreatingFolder(true)}
            title="New folder"
            disabled={driveView || trashView}
          >
            <FolderPlus size={14} />
          </ToolBtn>
          {selectedEntry && !selectedEntry.is_dir && (
            <ToolBtn
              onClick={() => filesApi.download(selectedEntry.path, selectedEntry.name)}
              title="Download"
            >
              <Download size={14} />
            </ToolBtn>
          )}
          {selected && (
            <ToolBtn
              onClick={() => deleteMutation.mutate(selected)}
              title="Delete"
              danger
            >
              <Trash2 size={14} />
            </ToolBtn>
          )}

          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.07)", margin: "0 3px" }} />

          <ToolBtn onClick={() => setViewMode("grid")} active={viewMode === "grid"} title="Grid view">
            <LayoutGrid size={14} />
          </ToolBtn>
          <ToolBtn onClick={() => setViewMode("list")} active={viewMode === "list"} title="List view">
            <List size={14} />
          </ToolBtn>

          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
        </div>

        {/* Files area */}
        <div
          className="flex-1 overflow-auto"
          style={{ padding: viewMode === "list" ? 0 : 12 }}
          onClick={() => setSelected(null)}
        >
          {/* Trash view */}
          {trashView && (
            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: "#2d4035" }}>
              <PackageOpen size={52} />
              <p style={{ fontSize: 14, color: "#3a5040" }}>Trash is empty</p>
              <p style={{ fontSize: 12, color: "#2d4035" }}>Deleted files will appear here</p>
            </div>
          )}

          {/* Drive view */}
          {!trashView && driveView && (
            <div className="p-4">
              <div
                className="inline-flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer select-none transition-colors hover:bg-[#111f18]"
                onDoubleClick={enterFiles}
              >
                <HardDrive size={44} style={{ color: "#e0a855" }} />
                <span style={{ color: "#c8d8d0", fontSize: 12 }}>files</span>
              </div>
            </div>
          )}

          {/* Upload error */}
          {!driveView && !trashView && uploadError && (
            <div
              className="m-3 px-3 py-2 rounded-lg text-xs flex items-center justify-between"
              style={{ background: "rgba(224,85,85,0.12)", color: "#e07070", border: "1px solid rgba(224,85,85,0.25)" }}
            >
              Upload failed: {uploadError}
              <button onClick={() => setUploadError(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
            </div>
          )}

          {/* Loading */}
          {!driveView && !trashView && isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-[#00c896] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Empty */}
          {!driveView && !trashView && !isLoading && sortedFiles.length === 0 && !creatingFolder && (
            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: "#2d4035" }}>
              <Folder size={48} />
              <p style={{ fontSize: 13 }}>This folder is empty</p>
            </div>
          )}

          {/* Grid view */}
          {!driveView && !trashView && !isLoading && viewMode === "grid" && (sortedFiles.length > 0 || creatingFolder) && (
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))" }}
            >
              {creatingFolder && (
                <NewFolderCell
                  value={newFolderName}
                  onChange={setNewFolderName}
                  onCommit={commitNewFolder}
                  onCancel={() => { setCreatingFolder(false); setNewFolderName(""); }}
                />
              )}
              {sortedFiles.map((entry) => (
                <GridCell
                  key={entry.path}
                  entry={entry}
                  selected={selected === entry.path}
                  renaming={renaming === entry.path}
                  newName={newName}
                  favorited={isFavorite(entry.path)}
                  onNewNameChange={setNewName}
                  onClick={(e) => { e.stopPropagation(); setSelected(entry.path); }}
                  onDoubleClick={() => handleDoubleClick(entry)}
                  onRenameStart={() => { setRenaming(entry.path); setNewName(entry.name); }}
                  onRenameCommit={() => commitRename(entry)}
                  onToggleFavorite={() => toggleFavorite(entry)}
                />
              ))}
            </div>
          )}

          {/* List view */}
          {!driveView && !trashView && !isLoading && viewMode === "list" && (sortedFiles.length > 0 || creatingFolder) && (
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "rgba(0,0,0,0.2)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    position: "sticky",
                    top: 0,
                  }}
                >
                  <th
                    className="text-left font-medium"
                    style={{ padding: "8px 14px", fontSize: 11, color: "#4a6858", letterSpacing: "0.04em" }}
                  >
                    Name
                  </th>
                  <th
                    className="text-right font-medium"
                    style={{ padding: "8px 14px", fontSize: 11, color: "#4a6858", letterSpacing: "0.04em", width: 90 }}
                  >
                    Size
                  </th>
                  <th
                    className="text-right font-medium"
                    style={{ padding: "8px 14px", fontSize: 11, color: "#4a6858", letterSpacing: "0.04em", width: 120 }}
                  >
                    Modified
                  </th>
                </tr>
              </thead>
              <tbody>
                {creatingFolder && (
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td colSpan={3} style={{ padding: "10px 14px" }}>
                      <div className="flex items-center gap-2">
                        <Folder size={16} fill="#e0a855" stroke="none" />
                        <input
                          autoFocus
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); commitNewFolder(); }
                            if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName(""); }
                          }}
                          onBlur={() => {
                            if (newFolderName.trim()) commitNewFolder();
                            else { setCreatingFolder(false); setNewFolderName(""); }
                          }}
                          className="bg-transparent outline-none border-b flex-1"
                          style={{ borderColor: "#00c896", color: "#e8f0ec", fontSize: 13 }}
                          placeholder="New folder name"
                        />
                      </div>
                    </td>
                  </tr>
                )}
                {sortedFiles.map((entry) => (
                  <ListRow
                    key={entry.path}
                    entry={entry}
                    selected={selected === entry.path}
                    renaming={renaming === entry.path}
                    newName={newName}
                    favorited={isFavorite(entry.path)}
                    onNewNameChange={setNewName}
                    onClick={(e) => { e.stopPropagation(); setSelected(entry.path); }}
                    onDoubleClick={() => handleDoubleClick(entry)}
                    onRenameStart={() => { setRenaming(entry.path); setNewName(entry.name); }}
                    onRenameCommit={() => commitRename(entry)}
                    onToggleFavorite={() => toggleFavorite(entry)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Status bar */}
        <div
          className="flex items-center justify-between px-4 shrink-0"
          style={{
            height: 26,
            background: "rgba(0,0,0,0.28)",
            borderTop: "1px solid rgba(255,255,255,0.055)",
            color: "#3a5040",
            fontSize: 11,
          }}
        >
          <span>
            {trashView
              ? "Trash · empty"
              : driveView
              ? "files"
              : path === "/"
              ? `files · ${sortedFiles.filter((f) => f.is_dir).length} folders, ${sortedFiles.filter((f) => !f.is_dir).length} files`
              : `${path.split("/").pop()} · ${sortedFiles.filter((f) => f.is_dir).length} folders, ${sortedFiles.filter((f) => !f.is_dir).length} files`}
          </span>
          {selected && <span style={{ color: "#4a6858" }}>1 selected</span>}
        </div>
      </div>
    </div>
  );
}

// ── Sidebar helpers ────────────────────────────────────────────────────────────

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p
        className="px-4 pb-1 pt-3 "
        style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#2d4035", textTransform: "uppercase", margin: 4 }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  danger,
  muted,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  muted?: boolean;
  onClick?: () => void;
}) {
  const color = muted ? "#2d4035" : danger ? "#c05555" : active ? "#00c896" : "#7a9a8a";
  const iconColor = muted ? "#2d4035" : danger ? "#c05555" : active ? "#00c896" : "#e0a855";

  return (
    <button
      onClick={muted ? undefined : onClick}
      className="w-full flex items-center gap-2.5 text-left"
      style={{
        padding: "5px 10px",
        margin: "6px",
        width: "calc(100% - 12px)",
        borderRadius: 6,
        background: active ? "rgba(0,200,150,0.1)" : "transparent",
        color,
        fontSize: 13,
        cursor: muted ? "default" : "pointer",
        transition: muted ? "none" : "background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!active && !muted) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={(e) => {
        if (!muted) (e.currentTarget as HTMLElement).style.background = active ? "rgba(0,200,150,0.1)" : "transparent";
      }}
    >
      <span style={{ color: iconColor, display: "flex", alignItems: "center" }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ── Toolbar button ─────────────────────────────────────────────────────────────

function ToolBtn({
  children,
  onClick,
  disabled,
  active,
  danger,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center justify-center rounded-md transition-colors"
      style={{
        width: 30,
        height: 30,
        color: danger ? "#c05555" : active ? "#00c896" : "#5a7a6a",
        background: active ? "rgba(0,200,150,0.1)" : "transparent",
        opacity: disabled ? 0.25 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ── Cell props ─────────────────────────────────────────────────────────────────

interface CellProps {
  entry: FileEntry;
  selected: boolean;
  renaming: boolean;
  newName: string;
  favorited: boolean;
  onNewNameChange: (v: string) => void;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onRenameStart: () => void;
  onRenameCommit: () => void;
  onToggleFavorite: () => void;
}

// ── Grid cell ──────────────────────────────────────────────────────────────────

function GridCell({
  entry,
  selected,
  renaming,
  newName,
  favorited,
  onNewNameChange,
  onClick,
  onDoubleClick,
  onRenameStart,
  onRenameCommit,
  onToggleFavorite,
}: CellProps) {
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className="relative flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer select-none transition-colors group"
      style={{
        background: selected ? "rgba(0,200,150,0.12)" : "transparent",
        border: `1px solid ${selected ? "rgba(0,200,150,0.4)" : "transparent"}`,
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = selected ? "rgba(0,200,150,0.12)" : "transparent";
      }}
    >
      {/* Star button — visible on hover or when favorited */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          color: favorited ? "#e0a855" : "#4a6858",
          opacity: favorited ? 1 : undefined,
        }}
        title={favorited ? "Remove from favorites" : "Add to favorites"}
      >
        <Star size={11} fill={favorited ? "#e0a855" : "none"} />
      </button>

      {entry.is_dir ? (
        <Folder size={38} fill="#e0a855" stroke="none" />
      ) : (
        <File size={38} style={{ color: "#5a7a6a" }} />
      )}
      {renaming ? (
        <input
          autoFocus
          value={newName}
          onChange={(e) => onNewNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onRenameCommit();
            if (e.key === "Escape") onNewNameChange("");
          }}
          onBlur={onRenameCommit}
          onClick={(e) => e.stopPropagation()}
          className="w-full text-center bg-transparent outline-none border-b"
          style={{ borderColor: "#00c896", color: "#e8f0ec", fontSize: 12 }}
        />
      ) : (
        <span
          onDoubleClick={(e) => { e.stopPropagation(); onRenameStart(); }}
          className="text-center break-all line-clamp-2"
          style={{ color: "#a8c0b8", fontSize: 12, maxWidth: 78, lineHeight: 1.4 }}
        >
          {entry.name}
        </span>
      )}
    </div>
  );
}

// ── List row ───────────────────────────────────────────────────────────────────

function ListRow({
  entry,
  selected,
  renaming,
  newName,
  favorited,
  onNewNameChange,
  onClick,
  onDoubleClick,
  onRenameStart,
  onRenameCommit,
  onToggleFavorite,
}: CellProps) {
  return (
    <tr
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className="group"
      style={{
        background: selected ? "rgba(0,200,150,0.08)" : "transparent",
        cursor: "pointer",
        borderBottom: "1px solid rgba(255,255,255,0.035)",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = selected ? "rgba(0,200,150,0.08)" : "transparent";
      }}
    >
      <td style={{ padding: "9px 14px" }}>
        <div className="flex items-center gap-2.5">
          {entry.is_dir ? (
            <Folder size={15} fill="#e0a855" stroke="none" style={{ flexShrink: 0 }} />
          ) : (
            <File size={15} style={{ color: "#5a7a6a", flexShrink: 0 }} />
          )}
          {renaming ? (
            <input
              autoFocus
              value={newName}
              onChange={(e) => onNewNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onRenameCommit();
                if (e.key === "Escape") onNewNameChange("");
              }}
              onBlur={onRenameCommit}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent outline-none border-b flex-1"
              style={{ borderColor: "#00c896", color: "#e8f0ec", fontSize: 13 }}
            />
          ) : (
            <span
              onDoubleClick={(e) => { e.stopPropagation(); onRenameStart(); }}
              style={{ color: "#b8cec6", fontSize: 13 }}
            >
              {entry.name}
            </span>
          )}
          {/* Star — shows on hover or when favorited */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              color: favorited ? "#e0a855" : "#4a6858",
              opacity: favorited ? 1 : undefined,
              flexShrink: 0,
            }}
            title={favorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Star size={12} fill={favorited ? "#e0a855" : "none"} />
          </button>
        </div>
      </td>
      <td
        className="text-right"
        style={{ padding: "9px 14px", color: "#3a5040", fontSize: 12, width: 90 }}
      >
        {entry.is_dir ? "—" : formatSize(entry.size)}
      </td>
      <td
        className="text-right"
        style={{ padding: "9px 14px", color: "#3a5040", fontSize: 12, width: 120 }}
      >
        {formatDate(entry.mod_time)}
      </td>
    </tr>
  );
}

// ── New folder cell (grid) ─────────────────────────────────────────────────────

function NewFolderCell({
  value,
  onChange,
  onCommit,
  onCancel,
}: {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1.5 p-2 rounded-xl"
      style={{ border: "1px solid rgba(0,200,150,0.4)", background: "rgba(0,200,150,0.06)" }}
    >
      <Folder size={38} fill="#e0a855" stroke="none" />
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); onCommit(); }
          if (e.key === "Escape") onCancel();
        }}
        onBlur={() => { if (value.trim()) onCommit(); else onCancel(); }}
        placeholder="Name"
        className="w-full text-center bg-transparent outline-none border-b"
        style={{ borderColor: "#00c896", color: "#e8f0ec", fontSize: 12 }}
      />
    </div>
  );
}
