'use client';
import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3001/orders/${id}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (!order || order.error) return <div className="p-6 text-red-500">Không tìm thấy đơn hàng!</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/orders" className="flex items-center text-blue-600 hover:underline">
          <ArrowLeft size={16} className="mr-1" /> Quay lại danh sách
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Đơn hàng: {order.orderCode}</h1>
          <p className="text-gray-500 text-sm">Ngày tạo: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
        </div>
        <div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
            order.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'
          }`}>
            Trạng thái: {order.status}
          </span>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4 text-gray-800">Chi tiết sản phẩm cần sản xuất</h2>
      
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã hàng</TableHead>
              <TableHead>Chi tiết</TableHead>
              <TableHead>Số lượng (Bộ)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-blue-600">
                  <Link href={`/products/${item.productPart?.product?.id}`} className="hover:underline">
                    {item.productPart?.product?.code}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">
                  {item.productPart?.partName}
                </TableCell>
                <TableCell className="font-bold">{item.setQuantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
