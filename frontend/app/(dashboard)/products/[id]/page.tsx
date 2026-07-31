'use client';
import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3001/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (!product || product.error) return <div className="p-6 text-red-500">Không tìm thấy mã hàng!</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/products" className="flex items-center text-blue-600 hover:underline">
          <ArrowLeft size={16} className="mr-1" /> Quay lại danh sách
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Mã hàng: {product.code}</h1>
        <p className="text-gray-500 text-sm mb-4">Ngày cập nhật: {new Date(product.updatedAt).toLocaleString('vi-VN')}</p>
      </div>

      <h2 className="text-xl font-semibold mb-4 text-gray-800">Chi tiết các bộ phận</h2>
      
      <div className="space-y-6">
        {product.parts.map((part: any) => (
          <div key={part.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-700">{part.partName}</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Kích thước (Cạnh 1, 2, 3)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Loại mút</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Dày x Rộng x Dài</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Số lượng/Bộ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {part.pieces.map((piece: any) => (
                  <tr key={piece.id}>
                    <td className="px-4 py-2 text-gray-700">
                      {piece.edge1} x {piece.edge2} x {piece.edge3}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{piece.material?.name}</td>
                    <td className="px-4 py-2 text-blue-600 font-medium">
                      {piece.thickness} x {piece.width} x {piece.height}
                    </td>
                    <td className="px-4 py-2 font-bold">{piece.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
