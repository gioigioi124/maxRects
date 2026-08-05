import { Request, Response } from 'express';
import { processPackingForOrders } from '../services/packing/grouping.service';
import prisma from '../db/prisma';

export const runPacking = async (req: Request, res: Response): Promise<any> => {
  try {
    const { orderIds } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'orderIds array is required' });
    }

    const batches = await processPackingForOrders(orderIds);
    
    // Update order status to 'processing' or 'packed'
    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status: 'processing' }
    });

    res.json({ message: 'Packing completed', batches });
  } catch (error: any) {
    console.error('Error running packing:', error);
    res.status(500).json({ error: 'Failed to run packing', details: error.message });
  }
};

export const getBatches = async (req: Request, res: Response) => {
  try {
    const batches = await prisma.cuttingBatch.findMany({
      include: {
        material: true,
        reports: true,
        _count: {
          select: { items: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(batches);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch batches', details: error.message });
  }
};

export const getBatchById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const batch = await prisma.cuttingBatch.findUnique({
      where: { id },
      include: {
        material: true,
        reports: true,
        items: {
          include: {
            orderItem: {
              include: {
                order: true
              }
            },
            partPiece: true
          }
        }
      }
    });
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    res.json(batch);
  } catch (error: any) {
    console.error('Error fetching batch:', error);
    res.status(500).json({ error: 'Failed to fetch batch details', details: error.message });
  }
};

import { generatePackingSuggestions } from '../services/packing/suggestion.service';

export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const suggestions = await generatePackingSuggestions();
    res.json(suggestions);
  } catch (error: any) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions', details: error.message });
  }
};
