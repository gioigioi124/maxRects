import { Request, Response } from 'express';
import prisma from '../db/prisma';
import { generateOrderPdf, generatePartPdf, generateAllPartsPdf, generateBatchReportPdf } from '../services/print/pdf-report.service';

export const printOrder = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            productPart: {
              include: {
                product: true,
                pieces: { include: { material: true } }
              }
            }
          }
        }
      }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const pdfBuffer = await generateOrderPdf(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="order-${order.orderCode}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error printing order:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
};

export const printPart = async (req: Request, res: Response): Promise<any> => {
  try {
    const { partId } = req.params;
    const part = await prisma.productPart.findUnique({
      where: { id: partId },
      include: {
        product: true,
        pieces: { include: { material: true } }
      }
    });
    if (!part) return res.status(404).json({ error: 'Part not found' });

    const pdfBuffer = await generatePartPdf(part);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="part-${part.partName}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error printing part:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
};

export const printAllParts = async (req: Request, res: Response): Promise<any> => {
  try {
    const { productId } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        parts: {
          include: {
            pieces: { include: { material: true } }
          }
        }
      }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const pdfBuffer = await generateAllPartsPdf(product);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="product-${product.code}-all-parts.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error printing all parts:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
};

export const printBatchReport = async (req: Request, res: Response): Promise<any> => {
  try {
    const { batchId } = req.params;
    const batch = await prisma.cuttingBatch.findUnique({
      where: { id: batchId },
      include: {
        material: true,
        items: {
          include: {
            orderItem: { include: { order: true } },
            partPiece: { include: { productPart: true } }
          }
        },
        reports: true
      }
    });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const pdfBuffer = await generateBatchReportPdf(batch);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="batch-${batchId.substring(0, 8)}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error printing batch report:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
};