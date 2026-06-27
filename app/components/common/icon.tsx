// Minimal stroke-SVG icon set ported from the Firearm Studio prototype.
import * as React from "react";

const PATHS: Record<string, string[]> = {
  grid: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M14 14h7v7h-7z", "M3 14h7v7H3z"],
  users: [
    "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
    "M3 21v-1a6 6 0 0 1 12 0v1",
    "M17 11a4 4 0 0 0 4 6",
  ],
  target: [
    "M12 12m-9 0a9 9 0 1 0 18 0 9 9 0 1 0-18 0",
    "M12 12m-4.5 0a4.5 4.5 0 1 0 9 0 4.5 4.5 0 1 0-9 0",
    "M12 12h.01",
  ],
  box: ["M21 8l-9-5-9 5 9 5 9-5z", "M3 8v8l9 5 9-5V8", "M12 13v8"],
  shield: [
    "M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3z",
    "M9 12l2 2 4-4",
  ],
  file: [
    "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z",
    "M14 3v5h5",
    "M9 13h6",
    "M9 17h4",
  ],
  team: [
    "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
    "M2 21a8 8 0 0 1 16 0",
    "M19 8v6",
    "M22 11h-6",
  ],
  gear: [
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    "M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 0 1 4 0v.1A1.6 1.6 0 0 0 17 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z",
  ],
  list: [
    "M8 6h13",
    "M8 12h13",
    "M8 18h13",
    "M3 6h.01",
    "M3 12h.01",
    "M3 18h.01",
  ],
  search: ["M11 11m-7 0a7 7 0 1 0 14 0 7 7 0 1 0-14 0", "M21 21l-4.3-4.3"],
  bell: [
    "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9",
    "M13.7 21a2 2 0 0 1-3.4 0",
  ],
  plus: ["M12 5v14", "M5 12h14"],
  arrow: ["M5 12h14", "M13 6l6 6-6 6"],
  back: ["M19 12H5", "M11 18l-6-6 6-6"],
  check: ["M20 6L9 17l-5-5"],
  money: [
    "M2 7h20v10H2z",
    "M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0",
    "M6 7v10",
    "M18 7v10",
  ],
  send: ["M22 2L11 13", "M22 2l-7 20-4-9-9-4 20-7z"],
  cal: ["M3 4h18v18H3z", "M3 9h18", "M8 2v4", "M16 2v4"],
  alert: [
    "M12 9v4",
    "M12 17h.01",
    "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  ],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  dots: ["M12 12h.01", "M19 12h.01", "M5 12h.01"],
  pin: [
    "M12 21s-7-5.3-7-11a7 7 0 0 1 14 0c0 5.7-7 11-7 11z",
    "M12 10m-2.5 0a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0",
  ],
  phone: [
    "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z",
  ],
  mail: ["M4 4h16v16H4z", "M22 6l-10 7L2 6"],
  edit: [
    "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
    "M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  ],
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  className,
  ...rest
}: {
  name: IconName;
  size?: number;
} & React.SVGProps<SVGSVGElement>) {
  const d = PATHS[name] ?? PATHS.dots;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {d.map((path, i) => (
        <path key={i} d={path} />
      ))}
    </svg>
  );
}
