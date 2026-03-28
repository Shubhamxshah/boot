// bootx logo — double chevron mark

export function LogoMark({ size = 40, color = "#00C896" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path
        d="M8 12L22 24L8 36"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 12L38 24L24 36"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.35"
      />
    </svg>
  );
}

// Full lockup: mark + wordmark
export function LogoLockup({
  size = 32,
  color = "#00C896",
  textColor = "#111827",
}: {
  size?: number;
  color?: string;
  textColor?: string;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.2) }}>
      <LogoMark size={size} color={color} />
      <span
        style={{
          fontSize: Math.round(size * 0.6),
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: textColor,
          lineHeight: 1,
          fontFamily: "inherit",
        }}
      >
        bootx
      </span>
    </span>
  );
}
