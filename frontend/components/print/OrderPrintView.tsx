'use client';
import React from 'react';

interface OrderPrintViewProps {
  order: {
    orderCode: string;
    status: string;
    createdAt: string;
    items: Array<{
      setQuantity: number;
      productPart: {
        partName: string;
        product: { code: string };
        pieces: Array<{
          edge1: number; edge2: number; edge3: number;
          width: number; height: number; thickness: number | null;
          quantity: number;
          material: { name: string };
        }>;
      };
    }>;
  };
}

export default function OrderPrintView({ order }: OrderPrintViewProps) {
  return (
    <div className="p-8 bg-white print:p-0">
      <h1 className="text-3xl font-bold mb-2 text-center uppercase">Phiếu Yêu Cầu Sản Xuất</h1>
      <p className="text-center mb-8 text-gray-600">Mã Đơn: {order.orderCode}</p>
      
      <div className="mb-6 flex justify-between">
        <div><strong>Ngày tạo:</strong> {new Date(order.createdAt).toLocaleString('vi-VN')}</div>
        <div><strong>Trạng thái:</strong> {order.status}</div>
      </div>

      <table className="w-full border-collapse border border-gray-800">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-800 px-4 py-2 text-left">STT</th>
            <th className="border border-gray-800 px-4 py-2 text-left">Mã Hàng</th>
            <th className="border border-gray-800 px-4 py-2 text-left">Chi Tiết</th>
            <th className="border border-gray-800 px-4 py-2 text-left">Số lượng (Bộ)</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={idx}>
              <td className="border border-gray-800 px-4 py-2 text-center">{idx + 1}</td>
              <td className="border border-gray-800 px-4 py-2 font-semibold">{item.productPart?.product?.code}</td>
              <td className="border border-gray-800 px-4 py-2">{item.productPart?.partName}</td>
              <td className="border border-gray-800 px-4 py-2 text-center font-bold">{item.setQuantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}