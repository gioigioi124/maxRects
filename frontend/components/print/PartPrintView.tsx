'use client';
import React from 'react';

interface PartPrintViewProps {
  part: {
    partName: string;
    product: { code: string };
    pieces: Array<{
      edge1: number; edge2: number; edge3: number;
      width: number; height: number; thickness: number | null;
      quantity: number;
      material: { name: string };
    }>;
  };
  orderCode?: string;
  setQuantity?: number;
}

export default function PartPrintView({ part, orderCode, setQuantity }: PartPrintViewProps) {
  return (
    <div className="p-8 bg-white print:p-0 print:break-after-page">
      <div className="mb-6 border-b-2 border-black pb-4">
        <h2 className="text-2xl font-bold uppercase">Chi Tiết Sản Xuất: {part.partName}</h2>
        <div className="flex justify-between mt-2 text-lg">
          <span><strong>Mã Hàng:</strong> {part.product?.code}</span>
          {setQuantity && <span><strong>Số Lượng Đặt:</strong> {setQuantity} Bộ</span>}
          {orderCode && <span><strong>Đơn Hàng:</strong> {orderCode}</span>}
        </div>
      </div>

      <table className="w-full border-collapse border border-black">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-4 py-2 text-center">Cạnh 1</th>
            <th className="border border-black px-4 py-2 text-center">Cạnh 2</th>
            <th className="border border-black px-4 py-2 text-center">Cạnh 3</th>
            <th className="border border-black px-4 py-2 text-center">Mút</th>
            <th className="border border-black px-4 py-2 text-center">Cắt Khổ (Dày x R x D)</th>
            <th className="border border-black px-4 py-2 text-center">SL/Bộ</th>
          </tr>
        </thead>
        <tbody>
          {part.pieces.map((piece, idx) => (
            <tr key={idx}>
              <td className="border border-black px-4 py-2 text-center">{piece.edge1}</td>
              <td className="border border-black px-4 py-2 text-center">{piece.edge2}</td>
              <td className="border border-black px-4 py-2 text-center">{piece.edge3}</td>
              <td className="border border-black px-4 py-2 text-center font-semibold">{piece.material?.name}</td>
              <td className="border border-black px-4 py-2 text-center font-bold">
                {piece.thickness ?? Math.min(piece.edge1, piece.edge2, piece.edge3)} x {piece.width} x {piece.height}
              </td>
              <td className="border border-black px-4 py-2 text-center font-bold">{piece.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}