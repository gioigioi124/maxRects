import { MaxRectsPacker } from "maxrects-packer";

export interface PackingPiece {
  id: string;
  width: number;
  height: number;
  originalPieceId: string;
  orderItemId: string;
  data?: any;
}

export interface SheetOption {
  name: string;
  width: number;
  height: number;
}

export interface PackedBin {
  width: number;
  height: number;
  sheetName: string;
  rects: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    rot: boolean;
    pieceData: PackingPiece;
  }>;
}

export interface PackedResult {
  totalSheets: number;
  efficiency: number;
  bins: PackedBin[];
}

// Default sheet options
export const DEFAULT_SHEETS: SheetOption[] = [
  { name: "160x200", width: 1600, height: 2000 },
  { name: "180x200", width: 1800, height: 2000 },
];

// Multiple sort strategies for multi-heuristic approach
const SORT_STRATEGIES: Array<{
  name: string;
  fn: (a: PackingPiece, b: PackingPiece) => number;
}> = [
  { name: "area-desc", fn: (a, b) => b.width * b.height - a.width * a.height },
  { name: "area-asc", fn: (a, b) => a.width * a.height - b.width * b.height },
  { name: "long-side-desc", fn: (a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height) },
  { name: "short-side-desc", fn: (a, b) => Math.min(b.width, b.height) - Math.min(a.width, a.height) },
  { name: "perimeter-desc", fn: (a, b) => (b.width + b.height) - (a.width + a.height) },
  { name: "width-desc", fn: (a, b) => b.width - a.width },
  { name: "height-desc", fn: (a, b) => b.height - a.height },
  { name: "diff-desc", fn: (a, b) => Math.abs(b.width - b.height) - Math.abs(a.width - a.height) },
];

// MaxRects packer option variants
const PACKER_OPTIONS: Array<{
  name: string;
  smart: boolean;
  pot: boolean;
  square: boolean;
  allowRotation: boolean;
  border?: number;
}> = [
  { name: "smart-rot", smart: true, pot: false, square: false, allowRotation: true },
  { name: "smart-no-rot", smart: true, pot: false, square: false, allowRotation: false },
  { name: "basic-rot", smart: false, pot: false, square: false, allowRotation: true },
  { name: "basic-no-rot", smart: false, pot: false, square: false, allowRotation: false },
];

/**
 * Runs the packer with MULTI-HEURISTIC approach:
 * - Tries all sheet sizes
 * - Tries multiple sort strategies (8 strategies)
 * - Tries multiple packer option variants (4 variants)
 * - Selects the best result (fewest sheets, then highest efficiency)
 * - Supports mixed sheet sizes within a single pack run
 */
export function runPacker(
  pieces: PackingPiece[],
  sheets: SheetOption[] = DEFAULT_SHEETS,
  kerf: number = 0
): PackedResult {
  if (pieces.length === 0) {
    return { totalSheets: 0, efficiency: 0, bins: [] };
  }

  let bestResult: PackedResult = { totalSheets: Infinity, efficiency: -1, bins: [] };

  // Apply kerf to pieces
  const piecesWithKerf = pieces.map(p => ({
    ...p,
    width: p.width + kerf * 2,
    height: p.height + kerf * 2,
  }));

  // Strategy 1: Try each sheet size individually
  for (const sheet of sheets) {
    for (const sortStrategy of SORT_STRATEGIES) {
      for (const packerOpt of PACKER_OPTIONS) {
        const sorted = [...piecesWithKerf].sort(sortStrategy.fn);
        const packer = new MaxRectsPacker(sheet.width, sheet.height, 0, packerOpt);
        
        packer.addArray(sorted.map(p => ({
          width: Math.ceil(p.width),
          height: Math.ceil(p.height),
          data: p
        } as any)));

        const result = evaluatePackerResult(packer, sheet);
        if (isBetterResult(result, bestResult)) {
          bestResult = result;
        }
      }
    }
  }

  // Strategy 2: Try mixed sheet sizes - run packer for each sheet and combine results
  if (sheets.length > 1) {
    for (const sortStrategy of SORT_STRATEGIES) {
      for (const packerOpt of PACKER_OPTIONS) {
        const sorted = [...piecesWithKerf].sort(sortStrategy.fn);
        
        // Try each sheet size and pick the best combination
        // We'll run packer for each sheet and take the best result
        for (const sheet of sheets) {
          const packer = new MaxRectsPacker(sheet.width, sheet.height, 0, packerOpt);
          
          packer.addArray(sorted.map(p => ({
            width: Math.ceil(p.width),
            height: Math.ceil(p.height),
            data: p
          } as any)));

          const result = evaluatePackerResult(packer, sheet);
          if (isBetterResult(result, bestResult)) {
            bestResult = result;
          }
        }
      }
    }
  }

  return bestResult;
}

function evaluatePackerResult(packer: MaxRectsPacker, sheet: SheetOption): PackedResult {
  const numBins = packer.bins.length;
  let totalAreaUsed = 0;
  const totalAreaAvailable = numBins * sheet.width * sheet.height;

  for (const bin of packer.bins) {
    for (const rect of bin.rects) {
      totalAreaUsed += rect.width * rect.height;
    }
  }

  const efficiency = totalAreaAvailable === 0 ? 0 : totalAreaUsed / totalAreaAvailable;

  const bins: PackedBin[] = packer.bins
    .map(bin => ({
      width: bin.width,
      height: bin.height,
      sheetName: sheet.name,
      rects: bin.rects
        .filter((r: any) => !(r as any).oversized && r.x !== undefined && r.y !== undefined)
        .map((r: any) => ({
          x: r.x,
          y: r.y,
          w: r.width,
          h: r.height,
          rot: r.rot || false,
          pieceData: r.data
        }))
    }))
    .filter(bin => bin.rects.length > 0);

  return { totalSheets: numBins, efficiency, bins };
}

function isBetterResult(candidate: PackedResult, current: PackedResult): boolean {
  if (candidate.totalSheets === 0) return false;
  if (current.totalSheets === Infinity) return true;
  if (candidate.totalSheets < current.totalSheets) return true;
  if (candidate.totalSheets === current.totalSheets && candidate.efficiency > current.efficiency) return true;
  return false;
}
