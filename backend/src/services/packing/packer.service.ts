import { packer, SortStrategy, SplitStrategy, SelectionStrategy } from "guillotine-packer";

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

/**
 * Runs the guillotine packer which supports true edge-to-edge cutting.
 * It automatically tries multiple heuristics under the hood to find the best layout.
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

  // Prepare items for guillotine-packer
  const itemsToPack = pieces.map(p => ({
    width: p.width,
    height: p.height,
    // Store original dimensions to detect rotation later
    originalWidth: p.width,
    originalHeight: p.height,
    data: p
  }));

  // Strategy 1: Try each sheet size individually
  for (const sheet of sheets) {
    // Filter out items that are physically too large for this sheet
    // We check if it can fit either normally or rotated
    const validItemsForSheet = itemsToPack.filter(item => {
      const fitsNormally = item.width <= sheet.width && item.height <= sheet.height;
      const fitsRotated = item.width <= sheet.height && item.height <= sheet.width;
      return fitsNormally || fitsRotated;
    });

    // If no items can fit this sheet, skip
    if (validItemsForSheet.length === 0) continue;

    // We manually specify a small subset of the best strategies to avoid a factorial explosion 
    // of all permutations which takes far too long (e.g. 35+ seconds per order).
    const strategyConfigs = [
      { sort: SortStrategy.Area, split: SplitStrategy.ShortLeftoverAxisSplit, select: SelectionStrategy.BEST_AREA_FIT }
    ];

    for (const config of strategyConfigs) {
      try {
        console.log(`Packing ${validItemsForSheet.length} items into sheet ${sheet.name} (${sheet.width}x${sheet.height}) with kerf ${kerf}...`);
        const startT = Date.now();
        const resultBins = packer(
          {
            binWidth: sheet.width,
            binHeight: sheet.height,
            items: validItemsForSheet
          },
          {
            kerfSize: kerf,
            allowRotation: true,
            sortStrategy: config.sort,
            splitStrategy: config.split,
            selectionStrategy: config.select
          }
        );

        if (resultBins) {
          const parsedResult = parseResult(resultBins, sheet);
          if (isBetterResult(parsedResult, bestResult)) {
            bestResult = parsedResult;
          }
        }
        console.log(`Done packing for sheet ${sheet.name} in ${Date.now() - startT}ms`);
      } catch (err) {
        console.warn(`Packer failed for sheet ${sheet.name} with config ${JSON.stringify(config)}:`, err);
      }
    }
  }

  // Strategy 2: Try mixed sheet sizes
  // Currently guillotine-packer only takes a single bin width/height per run.
  // To do mixed sizes, we'd have to pack iteratively. For now, picking the best uniform sheet is optimal enough.

  return bestResult;
}

function parseResult(resultBins: any[], sheet: SheetOption): PackedResult {
  const numBins = resultBins.length;
  let totalAreaUsed = 0;
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
        const rotated = (placedW !== item.originalWidth && placedW === item.originalHeight && placedH === item.originalWidth);

        totalAreaUsed += placedW * placedH;

        return {
          x: r.x,
          y: r.y,
          w: item.originalWidth,
          h: item.originalHeight,
          rot: rotated,
          pieceData: item.data
        };
      })
    };
  });

  const efficiency = totalAreaAvailable === 0 ? 0 : totalAreaUsed / totalAreaAvailable;
  return { totalSheets: numBins, efficiency, bins };
}

function isBetterResult(candidate: PackedResult, current: PackedResult): boolean {
  if (candidate.totalSheets === 0) return false;
  if (current.totalSheets === Infinity) return true;
  if (candidate.totalSheets < current.totalSheets) return true;
  if (candidate.totalSheets === current.totalSheets && candidate.efficiency > current.efficiency) return true;
  return false;
}
