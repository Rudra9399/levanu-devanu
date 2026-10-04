/**
 * Textile standard color dictionary for Surat garment/embroidery job-work.
 * Maps common vernacular and standard color names to hex codes for UI badges.
 */
export const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  red: { bg: "#EF4444", text: "#FFFFFF", border: "#DC2626" },
  black: { bg: "#0F172A", text: "#FFFFFF", border: "#020617" },
  yellow: { bg: "#EAB308", text: "#713F12", border: "#CA8A04" },
  maroon: { bg: "#881337", text: "#FFFFFF", border: "#4C0519" },
  "sky blue": { bg: "#38BDF8", text: "#0C4A6E", border: "#0284C7" },
  skyblue: { bg: "#38BDF8", text: "#0C4A6E", border: "#0284C7" },
  pink: { bg: "#EC4899", text: "#FFFFFF", border: "#DB2777" },
  "baby pink": { bg: "#F472B6", text: "#831843", border: "#EC4899" },
  "navy blue": { bg: "#1E3A8A", text: "#FFFFFF", border: "#172554" },
  navy: { bg: "#1E3A8A", text: "#FFFFFF", border: "#172554" },
  "bottle green": { bg: "#14532D", text: "#FFFFFF", border: "#052E16" },
  green: { bg: "#22C55E", text: "#FFFFFF", border: "#16A34A" },
  "rama green": { bg: "#0D9488", text: "#FFFFFF", border: "#0F766E" },
  rama: { bg: "#0D9488", text: "#FFFFFF", border: "#0F766E" },
  firozi: { bg: "#06B6D4", text: "#FFFFFF", border: "#0891B2" },
  orange: { bg: "#F97316", text: "#FFFFFF", border: "#EA580C" },
  white: { bg: "#FFFFFF", text: "#0F172A", border: "#CBD5E1" },
  lavender: { bg: "#A855F7", text: "#FFFFFF", border: "#9333EA" },
  wine: { bg: "#581C87", text: "#FFFFFF", border: "#3B0764" },
  mustard: { bg: "#D97706", text: "#FFFFFF", border: "#B45309" },
  gold: { bg: "#EAB308", text: "#78350F", border: "#CA8A04" },
  silver: { bg: "#94A3B8", text: "#0F172A", border: "#64748B" },
  grey: { bg: "#64748B", text: "#FFFFFF", border: "#475569" },
  gray: { bg: "#64748B", text: "#FFFFFF", border: "#475569" },
  purple: { bg: "#7E22CE", text: "#FFFFFF", border: "#6B21A8" },
  peach: { bg: "#FDBA74", text: "#7C2D12", border: "#FB923C" },
  teal: { bg: "#0F766E", text: "#FFFFFF", border: "#115E59" },
  olive: { bg: "#65A30D", text: "#FFFFFF", border: "#4D7C0F" },
  mint: { bg: "#6EE7B7", text: "#064E3B", border: "#34D399" },
  brown: { bg: "#78350F", text: "#FFFFFF", border: "#451A03" },
  cream: { bg: "#FEF3C7", text: "#78350F", border: "#FDE68A" },
  pista: { bg: "#86EFAC", text: "#14532D", border: "#4ADE80" },
  magenta: { bg: "#C026D3", text: "#FFFFFF", border: "#A21CAF" },
};

/**
 * Gets a color style object for a given color name string.
 */
export function getColorSwatch(name: string) {
  const normalized = name.toLowerCase().trim();
  if (COLOR_MAP[normalized]) {
    return COLOR_MAP[normalized];
  }

  // Generate a deterministic soft pastel/vibrant gradient if not in known map
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return {
    bg: `hsl(${hue}, 75%, 45%)`,
    text: "#FFFFFF",
    border: `hsl(${hue}, 75%, 35%)`,
  };
}
