import prisma from '../../db/prisma';
import { runPacker, PackingPiece, DEFAULT_SHEETS } from './packer.service';

interface Suggestion {
  materialId: string;
  thickness: number;
  orderCodes: string[];
  separateSheets: number;
  combinedSheets: number;
  savedSheets: number;
  savedPct: number;
  message: string;
}

const KERF = 3; // 3mm standard kerf

export async function generatePackingSuggestions(): Promise<Suggestion[]> {
  // 1. Fetch all unpacked order items
  const unpackedOrderItems = await prisma.orderItem.findMany({
    where: {
      cuttingBatchItems: { none: {} },
      order: { status: { in: ['draft', 'processing'] } }
    },
    include: {
      order: true,
      productPart: {
        include: {
          pieces: {
            include: {
              material: true
            }
          }
        }
      }
    }
  });

  // 2. Group by materialId and thickness
  const groups = new Map<string, { order: any, pieces: PackingPiece[] }[]>();
  
  for (const item of unpackedOrderItems) {
    if (!item.productPart) continue;

    for (const piece of item.productPart.pieces) {
      const edges = [Number(piece.edge1), Number(piece.edge2), Number(piece.edge3)].sort((a, b) => a - b);
      const thickness = piece.thickness ? Number(piece.thickness) : edges[0];
      const width = Number(piece.width);
      const height = Number(piece.height);

      const groupKey = `${piece.materialId}_${thickness}`;
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }

      const group = groups.get(groupKey)!;
      let orderGroup = group.find(g => g.order.id === item.orderId);
      if (!orderGroup) {
        orderGroup = { order: item.order, pieces: [] };
        group.push(orderGroup);
      }

      const totalQuantity = piece.quantity * item.setQuantity;
      for (let i = 0; i < totalQuantity; i++) {
        orderGroup.pieces.push({
          id: `${piece.id}_${item.id}_${i}`,
          width,
          height,
          originalPieceId: piece.id,
          orderItemId: item.id
        });
      }
    }
  }

  // 3. Calculate suggestions
  const suggestions: Suggestion[] = [];

  for (const [key, orderGroups] of groups.entries()) {
    if (orderGroups.length < 2) continue;

    const [materialId, thickness] = key.split('_');

    let separateSheets = 0;
    const combinedPieces: PackingPiece[] = [];
    const orderCodes = [];

    for (const og of orderGroups) {
      const res = runPacker(og.pieces, DEFAULT_SHEETS, KERF);
      separateSheets += res.totalSheets;
      combinedPieces.push(...og.pieces);
      orderCodes.push(og.order.orderCode);
    }

    const combinedRes = runPacker(combinedPieces, DEFAULT_SHEETS, KERF);
    const combinedSheets = combinedRes.totalSheets;

    if (combinedSheets < separateSheets) {
      const saved = separateSheets - combinedSheets;
      const savedPct = Math.round((saved / separateSheets) * 100);
      
      const materialName = orderGroups[0].pieces.length > 0 ? 
                           unpackedOrderItems.find(i => i.productPart.pieces.some(p => p.id === orderGroups[0].pieces[0].originalPieceId))?.productPart.pieces.find(p => p.id === orderGroups[0].pieces[0].originalPieceId)?.material?.name : 
                           materialId;

      suggestions.push({
        materialId,
        thickness: Number(thickness),
        orderCodes,
        separateSheets,
        combinedSheets,
        savedSheets: saved,
        savedPct,
        message: `Gộp đơn ${orderCodes.join(', ')} (Cùng mút ${materialName} dày ${thickness}mm): cắt riêng cần ${separateSheets} phôi, cắt gộp chỉ cần ${combinedSheets} phôi → tiết kiệm ${saved} phôi (~${savedPct}%).`
      });
    }
  }

  return suggestions;
}
