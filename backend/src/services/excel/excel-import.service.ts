import * as xlsx from 'xlsx';
import prisma from '../../db/prisma';

export async function importExcelData(fileBuffer: Buffer) {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[] = xlsx.utils.sheet_to_json(worksheet);

  // Group by Mã hàng (Product code)
  const productMap = new Map<string, {
    parts: Map<string, any[]>
  }>();

  for (const row of rawData) {
    const productCode = row['Mã hàng']?.toString().trim();
    const partName = row['Chi tiết']?.toString().trim();
    const edge1 = parseFloat(row['Cạnh 1']);
    const edge2 = parseFloat(row['Cạnh 2']);
    const edge3 = parseFloat(row['Cạnh 3']);
    const materialName = row['Loại mút']?.toString().trim();
    const quantity = parseInt(row['Số lượng'], 10);

    if (!productCode || !partName || !materialName || isNaN(edge1) || isNaN(edge2) || isNaN(edge3) || isNaN(quantity)) {
      continue; // Skip invalid rows
    }

    if (!productMap.has(productCode)) {
      productMap.set(productCode, { parts: new Map() });
    }
    
    const productData = productMap.get(productCode)!;
    
    if (!productData.parts.has(partName)) {
      productData.parts.set(partName, []);
    }
    
    const edges = [edge1, edge2, edge3].sort((a, b) => a - b);
    const width = edges[1];
    const height = edges[2];

    productData.parts.get(partName)!.push({
      edge1, edge2, edge3,
      width, height,
      materialName, quantity
    });
  }

  // Save to DB transactionally
  const materialCache = new Map<string, string>();
  
  await prisma.$transaction(async (tx) => {
    for (const [productCode, productData] of productMap.entries()) {
      // 1. Ensure product exists
      const product = await tx.product.upsert({
        where: { code: productCode },
        update: { updatedAt: new Date() },
        create: { code: productCode, name: productCode },
      });

      // 2. Logic cập nhật: mã hàng đã tồn tại → xóa product_parts cũ
      await tx.productPart.deleteMany({
        where: { productId: product.id }
      });

      // 3. Insert new parts and pieces
      for (const [partName, pieces] of productData.parts.entries()) {
        const part = await tx.productPart.create({
          data: {
            productId: product.id,
            partName: partName,
          }
        });

        // Ensure materials exist
        for (const p of pieces) {
          if (!materialCache.has(p.materialName)) {
            let material = await tx.material.findUnique({ where: { name: p.materialName } });
            if (!material) {
              material = await tx.material.create({ data: { name: p.materialName } });
            }
            materialCache.set(p.materialName, material.id);
          }
        }

        const piecesData = pieces.map(p => {
          const sortedEdges = [p.edge1, p.edge2, p.edge3].sort((a, b) => a - b);
          return {
            productPartId: part.id,
            edge1: p.edge1,
            edge2: p.edge2,
            edge3: p.edge3,
            thickness: sortedEdges[0],
            width: sortedEdges[1],
            height: sortedEdges[2],
            materialId: materialCache.get(p.materialName)!,
            quantity: p.quantity,
          };
        });

        await tx.partPiece.createMany({
          data: piecesData
        });
      }
    }
  }, {
    timeout: 60000,
    maxWait: 10000
  });
}
