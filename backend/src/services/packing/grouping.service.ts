import prisma from '../../db/prisma';
import { runPacker, PackingPiece, SheetOption, DEFAULT_SHEETS } from './packer.service';

// Kerf (mạch cắt) in mm - should be configurable per material
const DEFAULT_KERF = 3; // 3mm standard

export async function processPackingForOrders(
  orderIds: string[],
  sheets: SheetOption[] = DEFAULT_SHEETS,
  kerf: number = DEFAULT_KERF
) {
  // 1. Fetch all order items and their pieces
  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    include: {
      items: {
        include: {
          productPart: {
            include: {
              pieces: true
            }
          }
        }
      }
    }
  });

  if (orders.length === 0) {
    throw new Error('No orders found');
  }

  // 2. Group pieces by material and thickness
  const groups = new Map<string, PackingPiece[]>();

  for (const order of orders) {
    for (const item of order.items) {
      if (!item.productPart) continue;

      for (const piece of item.productPart.pieces) {
        // Calculate thickness and width/height
        const edges = [Number(piece.edge1), Number(piece.edge2), Number(piece.edge3)].sort((a, b) => a - b);
        const thickness = piece.thickness ? Number(piece.thickness) : edges[0];
        const width = Number(piece.width);
        const height = Number(piece.height);

        const groupKey = `${piece.materialId}_${thickness}`;

        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }

        const group = groups.get(groupKey)!;
        
        // Multiply by piece quantity * order item set quantity
        const totalQuantity = piece.quantity * item.setQuantity;

        for (let i = 0; i < totalQuantity; i++) {
          group.push({
            id: `${piece.id}_${item.id}_${i}`,
            width: width,
            height: height,
            originalPieceId: piece.id,
            orderItemId: item.id
          });
        }
      }
    }
  }

  // 3. Run packer for each group and save results
  const createdBatches = [];

  for (const [key, pieces] of groups.entries()) {
    const [materialId, thickness] = key.split('_');

    // Run packer with multi-heuristic approach and kerf
    const result = runPacker(pieces, sheets, kerf);

    if (result.bins.length > 0) {
      // Save to database
      const batch = await prisma.cuttingBatch.create({
        data: {
          materialId,
          thickness: Number(thickness),
          status: 'suggested',
          items: {
            create: result.bins.flatMap((bin, index) => 
              bin.rects.map((rect: any) => {
                if (rect.x === undefined || rect.y === undefined) {
                  console.error('MISSING X/Y:', rect);
                }
                return {
                  orderItemId: rect.pieceData.orderItemId,
                  partPieceId: rect.pieceData.originalPieceId,
                  sheetIndex: index,
                  sheetSize: bin.sheetName,
                  x: rect.x ?? 0,
                  y: rect.y ?? 0,
                  w: rect.w,
                  h: rect.h,
                  rotated: !!rect.rot
                };
              })
            )
          },
          reports: {
            create: {
              totalSheets: result.totalSheets,
              utilizationPct: result.efficiency * 100,
            }
          }
        },
        include: {
          items: true,
          reports: true
        }
      });
      createdBatches.push(batch);
    }
  }

  return createdBatches;
}
