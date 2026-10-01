/** Original bee mascot drawing (simple, friendly) used next to the rainbow wordmark. */
export function BeeMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <ellipse cx="15" cy="15" rx="9" ry="6" fill="#E3F2FD" stroke="#2B1A10" strokeWidth="1.6" transform="rotate(-30 15 15)" />
      <ellipse cx="33" cy="15" rx="9" ry="6" fill="#E3F2FD" stroke="#2B1A10" strokeWidth="1.6" transform="rotate(30 33 15)" />
      <ellipse cx="24" cy="29" rx="14" ry="13" fill="#FFC72C" stroke="#2B1A10" strokeWidth="1.8" />
      <path d="M11 27c8 3 18 3 26 0M12 33c7 3 17 3 24 0" stroke="#2B1A10" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="19" cy="23" r="3.4" fill="#fff" stroke="#2B1A10" strokeWidth="1.2" />
      <circle cx="29" cy="23" r="3.4" fill="#fff" stroke="#2B1A10" strokeWidth="1.2" />
      <circle cx="19.6" cy="23.4" r="1.6" fill="#2B1A10" />
      <circle cx="28.4" cy="23.4" r="1.6" fill="#2B1A10" />
      <path d="M21 39c2 1.6 4 1.6 6 0" stroke="#2B1A10" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M20 16c-1-4-3-6-5-7M28 16c1-4 3-6 5-7" stroke="#2B1A10" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Rainbow({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`rainbow ${className}`} dir="ltr">
      {[...text].map((ch, i) => (ch === " " ? <span key={i}>&nbsp;</span> : <span key={i}>{ch}</span>))}
    </span>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-1.5">
      <BeeMark />
      <span className="flex flex-col leading-none">
        <Rainbow text="ice bee" className="display text-[25px] font-extrabold tracking-tight" />
        <span className="text-[10px] font-bold tracking-[0.25em] text-[var(--muted)]" dir="ltr">BEE WITH ME</span>
      </span>
    </span>
  );
}
