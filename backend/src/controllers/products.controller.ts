import { Request, Response } from 'express';
import { importExcelData } from '../services/excel/excel-import.service';
import prisma from '../db/prisma';

export const importProducts = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    await importExcelData(req.file.buffer);
    res.json({ message: 'Products imported successfully' });
  } catch (error: any) {
    console.error('Error importing Excel:', error);
    res.status(500).json({ error: 'Failed to import products', details: error.message });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { parts: true }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        parts: {
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
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { code, name } = req.body;
    const product = await prisma.product.update({
      where: { id },
      data: { code, name }
    });
    res.json(product);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Mã hàng đã tồn tại' });
    }
    res.status(500).json({ error: 'Lỗi khi cập nhật mã hàng', details: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id }
    });
    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Không thể xóa mã hàng vì đã có đơn hàng sử dụng mã này.' });
    }
    res.status(500).json({ error: 'Lỗi khi xóa mã hàng', details: error.message });
  }
};
