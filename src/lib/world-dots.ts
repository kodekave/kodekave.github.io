import { MAP_GRID } from "@/lib/map-grid";

/**
 * The world as dots: which cells of the land bitmap (lib/map-grid.ts) are land
 * in the part of the world the journey map shows, and which of them sit on a
 * coast. Shared by the map card (components/JourneyMap.tsx) and the scroll scene
 * (components/JourneyScene.tsx), where the point cloud forms the same dots, so
 * the two cannot disagree about where a dot goes.
 */

/** The part of the world on show, in degrees. It holds every place worked. */
export const LON_L = -135;
export const LON_R = 150;
export const LAT_T = 72;
export const LAT_B = -48;
export const SPAN_X = LON_R - LON_L;
export const SPAN_Y = LAT_T - LAT_B;

const { cols: COLS, rows: ROWS, step: STEP, latTop: GRID_TOP, lonLeft: GRID_LEFT } = MAP_GRID;
const COL_0 = Math.round((LON_L - GRID_LEFT) / STEP);
const COL_1 = Math.round((LON_R - GRID_LEFT) / STEP);
const ROW_0 = Math.round((GRID_TOP - LAT_T) / STEP);
const ROW_1 = Math.round((GRID_TOP - LAT_B) / STEP);

/** Cells across and down the view. The view's aspect is VIEW_COLS : VIEW_ROWS. */
export const VIEW_COLS = COL_1 - COL_0;
export const VIEW_ROWS = ROW_1 - ROW_0;

export type LandCell = {
  /** Column and row within the view, from its top-left. */
  c: number;
  r: number;
  /** A land cell with water (or the edge of the bitmap) on a side. */
  coast: boolean;
};

let cache: LandCell[] | null = null;

export function landCells(): LandCell[] {
  if (cache) return cache;
  const bin = atob(MAP_GRID.bits);
  const bits = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bits[i] = bin.charCodeAt(i);

  const land = (row: number, col: number) => {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
    const i = row * COLS + col;
    return ((bits[i >> 3] >> (i & 7)) & 1) === 1;
  };

  const cells: LandCell[] = [];
  for (let r = ROW_0; r < ROW_1; r++) {
    for (let c = COL_0; c < COL_1; c++) {
      if (!land(r, c)) continue;
      const coast = !land(r - 1, c) || !land(r + 1, c) || !land(r, c - 1) || !land(r, c + 1);
      cells.push({ c: c - COL_0, r: r - ROW_0, coast });
    }
  }
  cache = cells;
  return cells;
}

export function formatCoord(lat: number, lon: number, approx = false): string {
  const d = approx ? 0 : 1;
  const la = `${Math.abs(lat).toFixed(d)}°${lat >= 0 ? "N" : "S"}`;
  const lo = `${Math.abs(lon).toFixed(d)}°${lon >= 0 ? "E" : "W"}`;
  return `${approx ? "≈" : ""}${la} ${lo}`;
}
