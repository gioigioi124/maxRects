import {
  packer,
  SortStrategy,
  SplitStrategy,
  SelectionStrategy,
} from "guillotine-packer";

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
  packedCount: number;
}

// Default sheet options
export const DEFAULT_SHEETS: SheetOption[] = [
  { name: "160x200", width: 1600, height: 2000 },
  { name: "180x200", width: 1800, height: 2000 },
];

/**
 * Runs the guillotine packer which supports true edge-to-edge cutting.
 * It automatically tries multiple heuristics under the hood to find the best layout.
 */
export function runPacker(
  pieces: PackingPiece[],
  sheets: SheetOption[] = DEFAULT_SHEETS,
  kerf: number = 0,
): PackedResult {
  if (pieces.length === 0) {
    return { totalSheets: 0, efficiency: 0, bins: [], packedCount: 0 };
  }

  // Prepare items for guillotine-packer
  const allItemsToPack = pieces.map((p) => ({
    width: p.width,
    height: p.height,
    originalWidth: p.width,
    originalHeight: p.height,
    data: p,
  }));

  // Separate sheets into normal (<=2000) and oversized (>2000)
  const oversizedSheets = sheets.filter(s => s.width > 2000 || s.height > 2000);
  const normalSheets = sheets.filter(s => s.width <= 2000 && s.height <= 2000);
  const fallbackSheets = normalSheets.length > 0 ? normalSheets : sheets;

  const hasOversizedPieces = allItemsToPack.some(p => p.width > 2000 || p.height > 2000);

  // Helper to pack items into a specific set of sheets
  const packOnSheets = (items: any[], allowedSheets: SheetOption[]): PackedResult => {
    let bestResult: PackedResult = { totalSheets: Infinity, efficiency: -1, bins: [], packedCount: -1 };
    
    for (const sheet of allowedSheets) {
      const validItemsForSheet = items.filter((item) => {
        const fitsNormally = item.width <= sheet.width && item.height <= sheet.height;
        const fitsRotated = item.width <= sheet.height && item.height <= sheet.width;
        return fitsNormally || fitsRotated;
      });

      if (validItemsForSheet.length === 0) continue;

      try {
        const resultBins = packer(
          { binWidth: sheet.width, binHeight: sheet.height, items: validItemsForSheet },
          { kerfSize: kerf, allowRotation: true, sortStrategy: SortStrategy.Area, splitStrategy: SplitStrategy.ShortLeftoverAxisSplit, selectionStrategy: SelectionStrategy.BEST_AREA_FIT }
        );

        if (resultBins) {
          const parsedResult = parseResult(resultBins, sheet);
          if (isBetterResult(parsedResult, bestResult)) {
            bestResult = parsedResult;
          }
        }
      } catch (err) {
        console.warn(`Packer failed for sheet ${sheet.name}`, err);
      }
    }
    return bestResult;
  };

  // If there are oversized pieces AND oversized sheets are available
  if (hasOversizedPieces && oversizedSheets.length > 0) {
    // 1. Pack ALL items into oversized sheets
    const oversizedResult = packOnSheets(allItemsToPack, oversizedSheets);
    
    if (oversizedResult.bins.length > 0) {
      // 2. Keep ONLY the bins that contain at least one oversized piece
      const keptBins: PackedBin[] = [];
      const packedOriginalIds = new Set<string>();

      for (const bin of oversizedResult.bins) {
        const hasOversized = bin.rects.some(r => r.w > 2000 || r.h > 2000);
        if (hasOversized) {
          keptBins.push(bin);
          for (const r of bin.rects) {
            packedOriginalIds.add(r.pieceData.id);
          }
        }
      }

      // 3. Filter remaining items (those not in kept bins)
      const remainingItems = allItemsToPack.filter(item => !packedOriginalIds.has(item.data.id));

      // 4. Pack remaining items into normal sheets
      let normalBins: PackedBin[] = [];
      if (remainingItems.length > 0) {
        const normalResult = packOnSheets(remainingItems, fallbackSheets);
        normalBins = normalResult.bins;
      }

      // 5. Combine bins
      const combinedBins = [...keptBins, ...normalBins];
      
      // Calculate final result stats
      let totalAreaUsed = 0;
      let totalAreaAvailable = 0;
      let packedCount = 0;

      for (const bin of combinedBins) {
        totalAreaAvailable += bin.width * bin.height;
        for (const r of bin.rects) {
          totalAreaUsed += r.w * r.h;
          packedCount++;
        }
      }
      
      const efficiency = totalAreaAvailable === 0 ? 0 : totalAreaUsed / totalAreaAvailable;
      return { totalSheets: combinedBins.length, efficiency, bins: combinedBins, packedCount };
    }
  }

  // If no oversized pieces or oversized packing failed, just pack all on normal sheets
  return packOnSheets(allItemsToPack, fallbackSheets);
}

function parseResult(resultBins: any[], sheet: SheetOption): PackedResult {
  const numBins = resultBins.length;
  let totalAreaUsed = 0;
  let packedCount = 0;
  const totalAreaAvailable = numBins * sheet.width * sheet.height;

  const bins: PackedBin[] = resultBins.map((binItems) => {
    return {
      width: sheet.width,
      height: sheet.height,
      sheetName: sheet.name,
      rects: binItems.map((r: any) => {
        const item = r.item;
        const placedW = r.width;
        const placedH = r.height;

        // Detect if the packer rotated the piece
        const rotated =
          placedW !== item.originalWidth &&
          placedW === item.originalHeight &&
          placedH === item.originalWidth;

        totalAreaUsed += placedW * placedH;
        packedCount++;

        return {
          x: r.x,
          y: r.y,
          w: item.originalWidth,
          h: item.originalHeight,
          rot: rotated,
          pieceData: item.data,
        };
      }),
    };
  });

  const efficiency =
    totalAreaAvailable === 0 ? 0 : totalAreaUsed / totalAreaAvailable;
  return { totalSheets: numBins, efficiency, bins, packedCount };
}

function isBetterResult(
  candidate: PackedResult,
  current: PackedResult,
): boolean {
  if (candidate.totalSheets === 0 && candidate.packedCount === 0) return false;
  
  // Rule 1: Always prefer the solution that packs MORE items
  if (candidate.packedCount > current.packedCount) return true;
  if (candidate.packedCount < current.packedCount) return false;

  // Rule 2: If packed count is same, prefer FEWER sheets
  if (candidate.totalSheets < current.totalSheets) return true;
  if (candidate.totalSheets > current.totalSheets) return false;
  
  // Rule 3: If sheets are same, prefer HIGHER efficiency
  if (candidate.efficiency > current.efficiency) return true;
  
  return false;
}
