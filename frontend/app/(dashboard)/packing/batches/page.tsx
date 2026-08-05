'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Settings } from 'lucide-react';

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/packing/batches')
      .then(res => res.json())
      .then(data => setBatches(data))
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Danh sách Mẻ Cắt (Cutting Batches)</h1>
          <p className="text-gray-500 text-sm">Các mẻ cắt được tạo ra từ thuật toán Xếp Hình</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã Mẻ Cắt (ID)</TableHead>
              <TableHead>Chất liệu</TableHead>
              <TableHead>Độ dày (mm)</TableHead>
              <TableHead>Số lượng tấm (Phôi)</TableHead>
              <TableHead>Tổng chi tiết</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map(batch => {
              const totalSheets = batch.reports?.[0]?.totalSheets || 0;
              return (
                <TableRow key={batch.id}>
                  <TableCell className="font-mono text-sm text-gray-600">
                    {batch.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="font-semibold">{batch.material?.name}</TableCell>
                  <TableCell className="font-bold">{batch.thickness}</TableCell>
                  <TableCell>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">
                      {totalSheets} Tấm
                    </span>
                  </TableCell>
                  <TableCell>{batch._count?.items || 0} Miếng</TableCell>
                  <TableCell>{new Date(batch.createdAt).toLocaleString('vi-VN')}</TableCell>
                  <TableCell>
                    <Link href={`/packing/batches/${batch.id}`}>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <Eye size={16} /> Chi tiết & Sơ đồ
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
            {batches.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Chưa có mẻ cắt nào được tạo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
