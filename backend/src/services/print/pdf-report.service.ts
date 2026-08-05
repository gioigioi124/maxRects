import PDFDocument from 'pdfkit';

interface OrderPrintData {
  orderCode: string;
  status: string;
  createdAt: Date | string | null;
  items: Array<{
    productPart: {
      partName: string;
      product: { code: string };
      pieces: Array<{
        edge1: number | { toNumber(): number };
        edge2: number | { toNumber(): number };
        edge3: number | { toNumber(): number };
        width: number | { toNumber(): number };
        height: number | { toNumber(): number };
        thickness: number | { toNumber(): number } | null;
        quantity: number;
        material: { name: string };
      }>;
    };
    setQuantity: number;
  }>;
}

interface PartPrintData {
  partName: string;
  product?: { code: string } | null;
  pieces: Array<{
    edge1: number | { toNumber(): number };
    edge2: number | { toNumber(): number };
    edge3: number | { toNumber(): number };
    width: number | { toNumber(): number };
    height: number | { toNumber(): number };
    thickness: number | { toNumber(): number } | null;
    quantity: number;
    material: { name: string };
  }>;
}

interface BatchReportData {
  id: string;
  material: { name: string };
  thickness: number | { toNumber(): number };
  items: Array<{
    sheetIndex: number;
    sheetSize: string;
    x: number | { toNumber(): number };
    y: number | { toNumber(): number };
    w: number | { toNumber(): number };
    h: number | { toNumber(): number };
    rotated: boolean;
    orderItem: { order: { orderCode: string } };
    partPiece: { productPart: { partName: string } };
  }>;
  reports: Array<{
    totalSheets: number;
    utilizationPct: number | { toNumber(): number } | null;
    totalVolumeM3: number | { toNumber(): number } | null;
  }>;
}

function toNum(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  if (typeof v.toNumber === 'function') return v.toNumber();
  return Number(v);
}

function drawTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][], startY: number, options?: { headerBg?: string; fontSize?: number }): number {
  const fontSize = options?.fontSize || 8;
  const colWidth = (doc.page.width - 140) / headers.length;
  let y = startY;
  const rowHeight = 18;

  // Header
  doc.fontSize(fontSize).font('Helvetica-Bold');
  headers.forEach((h, i) => {
    doc.text(h, 70 + i * colWidth, y + 4, { width: colWidth, align: 'center' });
  });
  y += rowHeight;
  doc.moveTo(70, y).lineTo(70 + headers.length * colWidth, y).stroke();

  // Rows
  doc.font('Helvetica').fontSize(fontSize - 1);
  for (const row of rows) {
    row.forEach((cell, i) => {
      doc.text(cell, 70 + i * colWidth, y + 4, { width: colWidth, align: 'center' });
    });
    y += rowHeight;
    doc.moveTo(70, y).lineTo(70 + headers.length * colWidth, y).stroke();
  }

  return y;
}

export async function generateOrderPdf(order: OrderPrintData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('PHIẾU YÊU CẦU SẢN XUẤT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Mã đơn: ${order.orderCode}`, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(9).text(`Ngày tạo: ${order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'N/A'}  |  Trạng thái: ${order.status}`, { align: 'center' });
    doc.moveDown(1);

    // Table
    const headers = ['STT', 'Mã hàng', 'Chi tiết', 'Số lượng (Bộ)'];
    const rows = order.items.map((item, idx) => [
      String(idx + 1),
      item.productPart?.product?.code || '',
      item.productPart?.partName || '',
      String(item.setQuantity)
    ]);
    drawTable(doc, headers, rows, doc.y);

    doc.end();
  });
}

export async function generatePartPdf(part: PartPrintData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text('CHI TIẾT SẢN XUẤT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Mã hàng: ${part.product?.code}  |  Chi tiết: ${part.partName}`, { align: 'center' });
    doc.moveDown(1);

    const headers = ['Cạnh 1', 'Cạnh 2', 'Cạnh 3', 'Loại mút', 'Cắt khổ (DxRxD)', 'SL'];
    const rows = part.pieces.map(p => [
      String(toNum(p.edge1)), String(toNum(p.edge2)), String(toNum(p.edge3)),
      p.material?.name || '',
      `${toNum(p.thickness ?? Math.min(toNum(p.edge1), toNum(p.edge2), toNum(p.edge3)))}x${toNum(p.width)}x${toNum(p.height)}`,
      String(p.quantity)
    ]);
    drawTable(doc, headers, rows, doc.y);

    doc.end();
  });
}

export async function generateAllPartsPdf(product: { code: string; parts: PartPrintData[] }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).font('Helvetica-Bold').text(`MÃ HÀNG: ${product.code}`, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Danh sách tất cả chi tiết', { align: 'center' });
    doc.moveDown(1);

    for (const part of product.parts) {
      // Check if we need a new page
      if (doc.y > 500) doc.addPage();

      doc.fontSize(12).font('Helvetica-Bold').text(`Chi tiết: ${part.partName}`, { underline: true });
      doc.moveDown(0.3);

      const headers = ['Cạnh 1', 'Cạnh 2', 'Cạnh 3', 'Loại mút', 'Cắt khổ (DxRxD)', 'SL'];
      const rows = part.pieces.map(p => [
        String(toNum(p.edge1)), String(toNum(p.edge2)), String(toNum(p.edge3)),
        p.material?.name || '',
        `${toNum(p.thickness ?? Math.min(toNum(p.edge1), toNum(p.edge2), toNum(p.edge3)))}x${toNum(p.width)}x${toNum(p.height)}`,
        String(p.quantity)
      ]);
      drawTable(doc, headers, rows, doc.y + 5);
      doc.moveDown(1);
    }

    doc.end();
  });
}

export async function generateBatchReportPdf(batch: BatchReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const report = batch.reports?.[0];
    const totalSheets = report?.totalSheets || 0;
    const utilization = toNum(report?.utilizationPct);

    doc.fontSize(18).font('Helvetica-Bold').text('BÁO CÁO CẮT (PACKING REPORT)', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Mẻ cắt: ${batch.id.substring(0, 8)}...  |  ${batch.material?.name}  |  Dày ${toNum(batch.thickness)}mm`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Tổng số phôi: ${totalSheets}  |  Hiệu suất: ${typeof utilization === 'number' ? utilization.toFixed(1) : 'N/A'}%`, { align: 'center' });
    doc.moveDown(1);

    // Group items by sheet
    const sheetMap = new Map<number, typeof batch.items>();
    for (const item of batch.items) {
      const list = sheetMap.get(item.sheetIndex) || [];
      list.push(item);
      sheetMap.set(item.sheetIndex, list);
    }

    for (const [sheetIdx, items] of sheetMap.entries()) {
      if (doc.y > 600) doc.addPage();

      doc.fontSize(12).font('Helvetica-Bold').text(`Tấm phôi #${sheetIdx + 1} - Khổ: ${items[0]?.sheetSize || 'N/A'}`, { underline: true });
      doc.moveDown(0.3);

      const headers = ['Mã đơn', 'Chi tiết', 'X', 'Y', 'Rộng', 'Dài', 'Xoay'];
      const rows = items.map(item => [
        item.orderItem?.order?.orderCode || '',
        item.partPiece?.productPart?.partName || '',
        String(Math.round(Number(item.x))),
        String(Math.round(Number(item.y))),
        String(Math.round(Number(item.w))),
        String(Math.round(Number(item.h))),
        item.rotated ? 'Có' : 'Không'
      ]);
      drawTable(doc, headers, rows, doc.y + 5);
      doc.moveDown(0.5);
    }

    doc.end();
  });
}