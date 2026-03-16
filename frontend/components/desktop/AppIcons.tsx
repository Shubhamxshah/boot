export const VSCodeIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M74.9 6.6L51 43.9 31.5 26.4 6 40.1v19.8l25.5 13.7L51 55.9l23.9 37.3L94 81.8V18.2L74.9 6.6z" fill="#007ACC"/>
    <path d="M6 40.1l25.5 13.7L51 43.9 31.5 26.4z" fill="white" opacity="0.35"/>
    <path d="M74.9 93.4L51 55.9l23.9-12.0V93.4z" fill="white" opacity="0.35"/>
  </svg>
);

export const BlenderIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 128 128">
    <circle cx="64" cy="64" r="60" fill="#EA7600"/>
    <circle cx="64" cy="64" r="38" fill="white"/>
    <circle cx="64" cy="64" r="23" fill="#EA7600"/>
    <circle cx="64" cy="64" r="11" fill="white"/>
    <rect x="60" y="8" width="8" height="30" rx="4" fill="white"/>
    <rect x="90" y="44" width="30" height="8" rx="4" fill="white" transform="rotate(60 105 48)"/>
    <rect x="8" y="44" width="30" height="8" rx="4" fill="white" transform="rotate(-60 23 48)"/>
  </svg>
);

export const UbuntuIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 128 128">
    <circle cx="64" cy="64" r="60" fill="#E95420"/>
    <circle cx="64" cy="26" r="11" fill="white"/>
    <circle cx="26" cy="88" r="11" fill="white"/>
    <circle cx="102" cy="88" r="11" fill="white"/>
    <circle cx="64" cy="64" r="18" fill="none" stroke="white" strokeWidth="7"/>
    <line x1="64" y1="37" x2="64" y2="46" stroke="white" strokeWidth="7"/>
    <line x1="37" y1="80" x2="45" y2="76" stroke="white" strokeWidth="7"/>
    <line x1="91" y1="80" x2="83" y2="76" stroke="white" strokeWidth="7"/>
  </svg>
);

export const GazeboIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 128 128">
    <circle cx="64" cy="64" r="60" fill="#1a2433"/>
    <circle cx="64" cy="44" r="14" fill="#6B4FBB"/>
    <rect x="50" y="56" width="28" height="32" rx="4" fill="#6B4FBB"/>
    <rect x="36" y="62" width="14" height="8" rx="4" fill="#8b6fd4"/>
    <rect x="78" y="62" width="14" height="8" rx="4" fill="#8b6fd4"/>
    <rect x="52" y="88" width="10" height="18" rx="4" fill="#8b6fd4"/>
    <rect x="66" y="88" width="10" height="18" rx="4" fill="#8b6fd4"/>
    <circle cx="59" cy="41" r="4" fill="white"/>
    <circle cx="69" cy="41" r="4" fill="white"/>
    <circle cx="59" cy="41" r="2" fill="#111"/>
    <circle cx="69" cy="41" r="2" fill="#111"/>
  </svg>
);

export const FileManagerIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
    <rect x="8" y="32" width="112" height="88" rx="10" fill="#1a2e22"/>
    <rect x="8" y="32" width="48" height="88" rx="10" fill="#142418"/>
    <rect x="8" y="32" width="112" height="22" rx="10" fill="#e0a855"/>
    <rect x="56" y="32" width="64" height="22" rx="0" fill="#e0a855"/>
    <rect x="18" y="62" width="28" height="8" rx="4" fill="#3a5040"/>
    <rect x="18" y="78" width="28" height="8" rx="4" fill="#3a5040"/>
    <rect x="18" y="94" width="28" height="8" rx="4" fill="#3a5040"/>
    <rect x="62" y="62" width="20" height="20" rx="4" fill="#e0a855" opacity="0.8"/>
    <rect x="88" y="62" width="20" height="20" rx="4" fill="#e0a855" opacity="0.8"/>
    <rect x="62" y="88" width="20" height="20" rx="4" fill="#e0a855" opacity="0.6"/>
    <rect x="88" y="88" width="20" height="20" rx="4" fill="#6b8a7a" opacity="0.6"/>
  </svg>
);

export const TerminalIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
    <rect x="8" y="16" width="112" height="96" rx="10" fill="#0a1510"/>
    <rect x="8" y="16" width="112" height="28" rx="10" fill="#111c16"/>
    <rect x="8" y="30" width="112" height="14" fill="#111c16"/>
    <circle cx="28" cy="30" r="6" fill="#e05555"/>
    <circle cx="48" cy="30" r="6" fill="#e0a855"/>
    <circle cx="68" cy="30" r="6" fill="#55c855"/>
    <text x="20" y="78" fontFamily="monospace" fontSize="20" fill="#00c896">$_</text>
    <rect x="20" y="88" width="60" height="4" rx="2" fill="#3a5040" opacity="0.6"/>
  </svg>
);

export const DrawerIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#6b8a7a"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#6b8a7a"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#6b8a7a"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#6b8a7a"/>
  </svg>
);

export function getAppSvgIcon(appId: string, size = 36) {
  switch (appId) {
    case "vscode": return <VSCodeIcon size={size} />;
    case "blender": return <BlenderIcon size={size} />;
    case "ubuntu": return <UbuntuIcon size={size} />;
    case "gazebo": return <GazeboIcon size={size} />;
    default: return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="rgba(255,255,255,0.2)"/>
        <rect x="8" y="8" width="8" height="8" rx="2" fill="rgba(255,255,255,0.5)"/>
      </svg>
    );
  }
}
