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
} from "lucide-react";
import { filesApi, FileEntry } from "@/lib/api/files";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderSubmittingRef = useRef(false);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["files", path],
    queryFn: () => filesApi.list(path),
    enabled: !driveView,
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
    setSelected(null);
  };

  const goForward = () => {
    if (!future.length) return;
    const next = future[0];
    setHistory((h) => [...h, path]);
    setFuture((f) => f.slice(1));
    setPath(next);
    setSelected(null);
  };

  const goUp = () => {
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
    const folderPath = path === "/" ? `/${newFolderName.trim()}` : `${path}/${newFolderName.trim()}`;
    mkdirMutation.mutate(folderPath, {
      onSettled: () => { folderSubmittingRef.current = false; },
    });
  };

  const selectedEntry = selected ? files.find((f) => f.path === selected) : null;

  const pathParts = path === "/" ? [""] : path.split("/");

  return (
    <div className="flex h-full text-sm" style={{ background: "rgba(10,15,12,0.75)", backdropFilter: "blur(24px)", color: "#c8d8d0" }}>
      {/* Sidebar */}
      <div
        className="flex flex-col shrink-0 overflow-y-auto"
        style={{
          width: 190,
          background: "rgba(0,0,0,0.25)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <SidebarSection title="EXPLORER">
          <SidebarItem
            icon={<HardDrive size={14} />}
            label="files"
            active={true}
            onClick={() => setDriveView(true)}
          />
        </SidebarSection>

        <SidebarSection title="FAVORITES">
          <p className="text-xs px-3 py-1" style={{ color: "#3a5040" }}>
            No favorites yet
          </p>
        </SidebarSection>

        <SidebarSection title="RECENT">
          {history.slice(-3).reverse().map((p) => (
            <SidebarItem
              key={p}
              icon={<Folder size={14} />}
              label={p === "/" ? "Home" : p.split("/").pop() ?? p}
              onClick={() => navigate(p)}
            />
          ))}
        </SidebarSection>

        <SidebarSection title="SYSTEM">
          <SidebarItem
            icon={<Home size={14} />}
            label="Home"
            onClick={() => setDriveView(true)}
          />
        </SidebarSection>

        <div className="mt-auto p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div
            className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-[#1a2e22]"
            style={{ color: "#e05555" }}
          >
            <Trash2 size={14} />
            <span className="text-xs">Trash</span>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div
          className="flex items-center gap-1 px-2 shrink-0"
          style={{
            height: 40,
            background: "rgba(0,0,0,0.15)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <ToolBtn onClick={goBack} disabled={!history.length} title="Back">
            <ArrowLeft size={14} />
          </ToolBtn>
          <ToolBtn onClick={goForward} disabled={!future.length} title="Forward">
            <ArrowRight size={14} />
          </ToolBtn>
          <ToolBtn onClick={goUp} disabled={driveView} title="Up">
            <ArrowUp size={14} />
          </ToolBtn>
          <ToolBtn onClick={() => refetch()} title="Refresh">
            <RefreshCw size={14} />
          </ToolBtn>

          {/* Breadcrumb */}
          <div
            className="flex-1 flex items-center gap-1 px-3 mx-2 rounded text-xs overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", height: 26 }}
          >
            {driveView ? (
              <span className="text-[#e8f0ec]">files</span>
            ) : (
              <>
                <button onClick={() => setDriveView(true)} className="hover:text-[#00c896] transition-colors shrink-0" style={{ color: "#6b8a7a" }}>files</button>
                {pathParts.filter(Boolean).map((part, i, arr) => {
                  const segPath = "/" + arr.slice(0, i + 1).join("/");
                  return (
                    <span key={i} className="flex items-center gap-1 shrink-0">
                      <span style={{ color: "#3a5040" }}>/</span>
                      <button
                        onClick={() => navigate(segPath)}
                        className="hover:text-[#00c896] transition-colors"
                        style={{ color: i === arr.length - 1 ? "#e8f0ec" : "#6b8a7a" }}
                      >
                        {part}
                      </button>
                    </span>
                  );
                })}
              </>
            )}
          </div>

          <ToolBtn onClick={() => fileInputRef.current?.click()} title="Upload">
            <Upload size={14} />
          </ToolBtn>
          <ToolBtn onClick={() => setCreatingFolder(true)} title="New folder">
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

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.06)", margin: "0 4px" }} />

          <ToolBtn onClick={() => setViewMode("grid")} active={viewMode === "grid"} title="Grid view">
            <LayoutGrid size={14} />
          </ToolBtn>
          <ToolBtn onClick={() => setViewMode("list")} active={viewMode === "list"} title="List view">
            <List size={14} />
          </ToolBtn>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {/* Files area */}
        <div
          className="flex-1 overflow-auto p-3"
          onClick={() => setSelected(null)}
        >
          {driveView && (
            <div className="grid gap-2 pt-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))" }}>
              <div
                className="flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer select-none hover:bg-[#1a2e22]"
                onDoubleClick={enterFiles}
              >
                <HardDrive size={40} style={{ color: "#e0a855" }} />
                <span className="text-xs text-center" style={{ color: "#c8d8d0" }}>files</span>
              </div>
            </div>
          )}
          {!driveView && uploadError && (
            <div
              className="mx-3 mt-2 px-3 py-2 rounded text-xs"
              style={{ background: "rgba(224,85,85,0.15)", color: "#e05555", border: "1px solid rgba(224,85,85,0.3)" }}
            >
              Upload failed: {uploadError}
              <button onClick={() => setUploadError(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
            </div>
          )}
          {!driveView && isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-[#00c896] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !driveView && sortedFiles.length === 0 && !creatingFolder ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Folder size={40} style={{ color: "#1a2e22" }} />
              <p style={{ color: "#3a5040" }}>Empty folder</p>
            </div>
          ) : !driveView && viewMode === "grid" ? (
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))" }}>
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
                  onNewNameChange={setNewName}
                  onClick={(e) => { e.stopPropagation(); setSelected(entry.path); }}
                  onDoubleClick={() => handleDoubleClick(entry)}
                  onRenameStart={() => { setRenaming(entry.path); setNewName(entry.name); }}
                  onRenameCommit={() => commitRename(entry)}
                />
              ))}
            </div>
          ) : !driveView ? (
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: "#3a5040", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="text-left py-1 px-2 font-normal">Name</th>
                  <th className="text-right py-1 px-2 font-normal">Size</th>
                  <th className="text-right py-1 px-2 font-normal">Modified</th>
                </tr>
              </thead>
              <tbody>
                {creatingFolder && (
                  <tr>
                    <td className="py-1 px-2" colSpan={3}>
                      <input
                        autoFocus
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); commitNewFolder(); }
                          if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName(""); }
                        }}
                        onBlur={() => { if (newFolderName.trim()) commitNewFolder(); else { setCreatingFolder(false); setNewFolderName(""); } }}
                        className="bg-transparent outline-none border-b border-[#00c896] w-full"
                        placeholder="New folder name"
                        style={{ color: "#e8f0ec" }}
                      />
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
                    onNewNameChange={setNewName}
                    onClick={(e) => { e.stopPropagation(); setSelected(entry.path); }}
                    onDoubleClick={() => handleDoubleClick(entry)}
                    onRenameStart={() => { setRenaming(entry.path); setNewName(entry.name); }}
                    onRenameCommit={() => commitRename(entry)}
                  />
                ))}
              </tbody>
            </table>
          ) : null}
        </div>

        {/* Status bar */}
        <div
          className="flex items-center justify-between px-3 shrink-0 text-xs"
          style={{
            height: 24,
            background: "rgba(0,0,0,0.3)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            color: "#3a5040",
          }}
        >
          <span>
            {path === "/" ? "files" : path.split("/").pop()} &nbsp;·&nbsp;
            {sortedFiles.filter((f) => f.is_dir).length} folders,{" "}
            {sortedFiles.filter((f) => !f.is_dir).length} files
          </span>
          {selected && <span style={{ color: "#6b8a7a" }}>1 selected</span>}
        </div>
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p
        className="px-3 py-1.5 text-xs font-semibold tracking-widest"
        style={{ color: "#3a5040" }}
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
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1 text-xs hover:bg-[#1a2e22] transition-colors text-left"
      style={{ color: active ? "#00c896" : "#6b8a7a" }}
    >
      <span style={{ color: active ? "#00c896" : "#e0a855" }}>{icon}</span>
      {label}
    </button>
  );
}

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
      className="flex items-center justify-center rounded transition-colors"
      style={{
        width: 28,
        height: 28,
        color: danger ? "#e05555" : active ? "#00c896" : "#6b8a7a",
        background: active ? "rgba(0,200,150,0.1)" : "transparent",
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

interface CellProps {
  entry: FileEntry;
  selected: boolean;
  renaming: boolean;
  newName: string;
  onNewNameChange: (v: string) => void;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onRenameStart: () => void;
  onRenameCommit: () => void;
}

function GridCell({
  entry,
  selected,
  renaming,
  newName,
  onNewNameChange,
  onClick,
  onDoubleClick,
  onRenameStart,
  onRenameCommit,
}: CellProps) {
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className="flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer select-none"
      style={{
        background: selected ? "rgba(0,200,150,0.12)" : "transparent",
        border: `1px solid ${selected ? "#00c896" : "transparent"}`,
      }}
    >
      {entry.is_dir ? (
        <Folder size={40} fill="#e0a855" stroke="none" />
      ) : (
        <File size={40} style={{ color: "#6b8a7a" }} />
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
          className="w-full text-center text-xs bg-transparent outline-none border-b border-[#00c896]"
          style={{ color: "#e8f0ec" }}
        />
      ) : (
        <span
          onDoubleClick={(e) => { e.stopPropagation(); onRenameStart(); }}
          className="text-xs text-center break-all line-clamp-2"
          style={{ color: "#c8d8d0", maxWidth: 80 }}
        >
          {entry.name}
        </span>
      )}
    </div>
  );
}

function ListRow({
  entry,
  selected,
  renaming,
  newName,
  onNewNameChange,
  onClick,
  onDoubleClick,
  onRenameStart,
  onRenameCommit,
}: CellProps) {
  return (
    <tr
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{
        background: selected ? "rgba(0,200,150,0.08)" : "transparent",
        cursor: "pointer",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <td className="py-1 px-2 flex items-center gap-2">
        {entry.is_dir ? (
          <Folder size={14} fill="#e0a855" stroke="none" />
        ) : (
          <File size={14} style={{ color: "#6b8a7a" }} />
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
            className="bg-transparent outline-none border-b border-[#00c896] flex-1"
            style={{ color: "#e8f0ec" }}
          />
        ) : (
          <span
            onDoubleClick={(e) => { e.stopPropagation(); onRenameStart(); }}
            style={{ color: "#c8d8d0" }}
          >
            {entry.name}
          </span>
        )}
      </td>
      <td className="py-1 px-2 text-right" style={{ color: "#3a5040" }}>
        {entry.is_dir ? "—" : formatSize(entry.size)}
      </td>
      <td className="py-1 px-2 text-right" style={{ color: "#3a5040" }}>
        {formatDate(entry.mod_time)}
      </td>
    </tr>
  );
}

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
    <div className="flex flex-col items-center gap-1 p-2 rounded-lg border border-[#00c896]">
      <Folder size={40} fill="#e0a855" stroke="none" />
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
        className="w-full text-center text-xs bg-transparent outline-none border-b border-[#00c896]"
        style={{ color: "#e8f0ec" }}
      />
    </div>
  );
}
