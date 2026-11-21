/**
 * FYT mobile tokens (docs/MOBILE-DESIGN.md §2): slate neutrals, azure accent,
 * teal reserved for progress. Identical keys in light and dark. No colour
 * literal belongs outside this file. No warm, gold or brown values anywhere.
 */
export interface Palette {
  paper: string;
  surface: string;
  sunken: string;
  raised: string;
  line: string;
  lineStrong: string;
  lineField: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  accentPressed: string;
  accentSoft: string;
  onAccentSoft: string;
  accentInk: string;
  /** The one committed-azure surface per screen (Home tonight panel) and the ink on it. */
  band: string;
  onBand: string;
  ok: string;
  okSoft: string;
  onOkSoft: string;
  warn: string;
  warnSoft: string;
  onWarnSoft: string;
  bad: string;
  badSoft: string;
  onBadSoft: string;
  info: string;
  infoSoft: string;
  onInfoSoft: string;
  teal: string;
  tealSoft: string;
  onTealSoft: string;
  scrim: string;
  shadow: string;
  skeleton: string;
  skeletonHi: string;
}

export const light: Palette = {
  paper: "#F5F7FB",
  surface: "#FFFFFF",
  sunken: "#EEF1F7",
  raised: "#FFFFFF",
  line: "#E3E7EF",
  lineStrong: "#CDD3DF",
  lineField: "#8A93AB",
  ink: "#0F1B3D",
  ink2: "#475472",
  ink3: "#636B88",
  accent: "#1E4FB8",
  accentPressed: "#1A45A0",
  accentSoft: "#E8EFFC",
  onAccentSoft: "#1A45A0",
  accentInk: "#FFFFFF",
  band: "#1E4FB8",
  onBand: "#FFFFFF",
  ok: "#059669",
  okSoft: "#E3F5EE",
  onOkSoft: "#047857",
  warn: "#CF4215",
  warnSoft: "#FCEBE6",
  onWarnSoft: "#A83510",
  bad: "#E11D48",
  badSoft: "#FDE8EC",
  onBadSoft: "#BE123C",
  info: "#0284C7",
  infoSoft: "#E3F2FB",
  onInfoSoft: "#0369A1",
  teal: "#0E9F8E",
  tealSoft: "#E0F5F2",
  onTealSoft: "#0B6B60",
  scrim: "rgba(15,27,61,0.45)",
  shadow: "#0F1B3D",
  skeleton: "#EEF1F7",
  skeletonHi: "#F7F9FC",
};

export const dark: Palette = {
  paper: "#0B0F19",
  surface: "#141926",
  sunken: "#0F1420",
  raised: "#1C2233",
  line: "#232A3B",
  lineStrong: "#2D364B",
  lineField: "#5A6580",
  ink: "#F1F3F8",
  ink2: "#C6CBDA",
  ink3: "#8B92A6",
  accent: "#6FA0FF",
  accentPressed: "#8AB3FF",
  accentSoft: "#1A2747",
  onAccentSoft: "#A9C4FF",
  accentInk: "#0B1530",
  band: "#1F3F86",
  onBand: "#F1F3F8",
  ok: "#34D399",
  okSoft: "#0F2E26",
  onOkSoft: "#34D399",
  warn: "#FF8A65",
  warnSoft: "#3A1719",
  onWarnSoft: "#FF8A65",
  bad: "#FB7185",
  badSoft: "#351822",
  onBadSoft: "#FB7185",
  info: "#38BDF8",
  infoSoft: "#0E2A3A",
  onInfoSoft: "#38BDF8",
  teal: "#2DD4BF",
  tealSoft: "#0F2E2B",
  onTealSoft: "#2DD4BF",
  scrim: "rgba(0,0,0,0.60)",
  shadow: "#000000",
  skeleton: "#1C2233",
  skeletonHi: "#232A3B",
};

/** 4 pt grid (spec §4.1). */
export const space = { s2: 2, s4: 4, s8: 8, s12: 12, s16: 16, s20: 20, s24: 24, s32: 32, s40: 40, s48: 48, s64: 64 } as const;
/** Screen gutter: 20, or 16 under 360 pt (see useLayout). */
export const GUTTER = 20;
export const TOUCH = 48;

/** Radii (spec §4.2). `control`/`card`/`sheet` kept as aliases for older screens. */
export const radius = { r6: 6, r12: 12, r16: 16, r20: 20, r24: 24, pill: 999, control: 12, card: 16, sheet: 24 } as const;
