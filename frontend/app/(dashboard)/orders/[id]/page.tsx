'use client';
import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { API_BASE } from '@/lib/api-client';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/orders/${id}`)
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

  if (loading) return <div className="p-4 sm:p-6 text-sm text-gray-500">Đang tải...</div>;
  if (!order || order.error) return <div className="p-4 sm:p-6 text-red-500 font-medium">Không tìm thấy đơn hàng!</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <Link href="/orders" className="inline-flex items-center text-sm text-blue-600 hover:underline">
          <ArrowLeft size={16} className="mr-1" /> Quay lại danh sách
        </Link>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Đơn hàng: {order.orderCode}</h1>
          <p className="text-gray-500 text-xs sm:text-sm">Ngày tạo: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
            order.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'
          }`}>
            Trạng thái: {order.status}
          </span>
          <Link href={`/print/orders/${id}?type=order`} target="_blank" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto flex items-center justify-center gap-2">
              <Printer size={16} /> In Tổng Hợp
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Chi tiết sản phẩm cần sản xuất</h2>
        <Link href={`/print/orders/${id}?type=all`} target="_blank" className="w-full sm:w-auto">
          <Button size="sm" className="w-full sm:w-auto flex items-center justify-center gap-2">
            <Printer size={16} /> In Từng Chi Tiết (Tất cả)
          </Button>
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã hàng</TableHead>
              <TableHead>Chi tiết</TableHead>
              <TableHead>Số lượng (Bộ)</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-semibold text-blue-600">
                  <Link href={`/products/${item.productPart?.product?.id}`} className="hover:underline">
                    {item.productPart?.product?.code}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">
                  {item.productPart?.partName}
                </TableCell>
                <TableCell className="font-bold">{item.setQuantity}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/print/orders/${id}?type=part&partId=${item.productPart?.id}`} target="_blank">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2">
                      <Printer size={16} />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
