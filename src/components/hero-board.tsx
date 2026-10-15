/*
 * Decorative circuit board for the home hero. Traces run from the chip
 * toward the copy, and a resistor, capacitor and LED stand in for the
 * components half of the store. Coordinates are hand-placed; parallel
 * traces keep a 45° pitch so none of them cross.
 */

const traces = [
  // right bank, fanning toward the copy
  "M421 165H480L510 135H600",
  "M421 188H492L522 158H600",
  "M421 211H600",
  "M421 234H492L522 264H600",
  "M421 257H480L510 287H600",
  "M421 280H468L498 310H560",
  // top bank
  "M275 129V100L245 70H160",
  "M298 129V90L328 60H600",
  "M344 129V108",
  "M390 129V105L415 80H600",
  // bottom bank
  "M275 311V340L245 370H116",
  "M321 311V408",
  "M390 311V345L420 375H600",
  // left bank, out to the parts
  "M239 165H200L170 135H90",
  "M239 211H146",
  "M239 257H190L160 287H64",
];

const vias: Array<[number, number]> = [
  [154, 70],
  [344, 102],
  [321, 414],
  [84, 135],
  [566, 310],
];

const pinOffsets = [0, 23, 46, 69, 92, 115];

export function HeroBoard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 440" aria-hidden className={className}>
      <g fill="none" stroke="#c27c3e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {traces.map((d, i) => (
          <path key={d} d={d} pathLength={1} className="trace" style={{ "--i": i } as React.CSSProperties} />
        ))}
      </g>

      <g fill="#0a3328" stroke="#c27c3e" strokeWidth="3">
        {vias.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="6" />
        ))}
      </g>

      {/* plated mounting holes */}
      <g fill="none" stroke="#c27c3e" strokeWidth="2.5">
        <circle cx="34" cy="34" r="12" />
        <circle cx="566" cy="406" r="12" />
      </g>

      {/* chip U1 */}
      <g fill="#c27c3e">
        {pinOffsets.map((o) => (
          <g key={o}>
            <rect x={270 + o} y="129" width="10" height="16" rx="2" />
            <rect x={270 + o} y="295" width="10" height="16" rx="2" />
            <rect x="239" y={160 + o} width="16" height="10" rx="2" />
            <rect x="405" y={160 + o} width="16" height="10" rx="2" />
          </g>
        ))}
      </g>
      <rect x="255" y="145" width="150" height="150" rx="10" fill="#08291f" stroke="#d9e6df" strokeOpacity="0.25" />
      <circle cx="271" cy="161" r="4" fill="#d9e6df" fillOpacity="0.7" />

      {/* resistor R1, capacitor C3, LED D1 */}
      <g fill="#c27c3e">
        <rect x="40" y="362" width="16" height="16" rx="3" />
        <rect x="100" y="362" width="16" height="16" rx="3" />
        <rect x="96" y="203" width="16" height="16" rx="3" />
        <rect x="130" y="203" width="16" height="16" rx="3" />
        <rect x="14" y="279" width="16" height="16" rx="3" />
        <rect x="48" y="279" width="16" height="16" rx="3" />
      </g>
      <g fill="none" stroke="#e8efe9" strokeOpacity="0.75" strokeWidth="1.5">
        <rect x="60" y="364" width="36" height="12" rx="2" />
        <circle cx="121" cy="211" r="27" />
        <path d="M39 267a20 20 0 1 0 14 6" />
      </g>

      <g
        fill="#e8efe9"
        fillOpacity="0.8"
        fontFamily="var(--font-plex-mono), monospace"
        fontSize="13"
        textAnchor="middle"
      >
        <text x="78" y="354">R1</text>
        <text x="121" y="174">C3</text>
        <text x="39" y="256">D1</text>
        <text x="226" y="142">U1</text>
        <text x="91" y="198">+</text>
        <text x="330" y="216" fontSize="20" letterSpacing="2">
          PE-01
        </text>
        <text x="330" y="242" fontSize="11" letterSpacing="3" fillOpacity="0.55">
          PEYMAN·ELEC
        </text>
      </g>
    </svg>
  );
}
