'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { API_BASE } from '@/lib/api-client';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    fetch(`${API_BASE}/orders`)
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) return;
    try {
      await fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' });
      fetchOrders();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Đơn hàng</h1>
        <Link href="/orders/new">
          <Button className="flex items-center gap-2">
            <Plus size={16} /> Tạo đơn hàng mới
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn hàng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Số lượng mã hàng</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order: any) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.orderCode}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    order.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {order.status}
                  </span>
                </TableCell>
                <TableCell>{order._count?.items || 0} mã</TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleString('vi-VN')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="h-8 flex items-center gap-1">
                        <Eye size={14} /> Xem
                      </Button>
                    </Link>
                    <Button variant="destructive" size="sm" className="h-8 flex items-center gap-1" onClick={() => handleDelete(order.id)}>
                      <Trash2 size={14} /> Xóa
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Chưa có đơn hàng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
