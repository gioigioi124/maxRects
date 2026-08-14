"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, CheckCircle } from "lucide-react";
import { API_BASE } from "@/lib/api-client";

export default function BatchesPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<Record<string, string>>({});

  const fetchRuns = () => {
    fetch(`${API_BASE}/packing/batches`)
      .then((res) => res.json())
      .then((data) => setRuns(data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lượt chạy (mẻ cắt) này?')) return;
    setLoadingAction(prev => ({ ...prev, [id]: 'deleting' }));
    try {
      const res = await fetch(`${API_BASE}/packing/batches/${id}`, { method: 'DELETE' });
      if (res.ok) fetchRuns();
      else alert('Xóa thất bại!');
    } catch (e) {
      console.error(e);
      alert('Lỗi khi xóa!');
    } finally {
      setLoadingAction(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleSave = async (id: string) => {
    setLoadingAction(prev => ({ ...prev, [id]: 'saving' }));
    try {
      const res = await fetch(`${API_BASE}/packing/batches/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'saved' })
      });
      if (res.ok) fetchRuns();
      else alert('Lưu thất bại!');
    } catch (e) {
      console.error(e);
      alert('Lỗi khi lưu!');
    } finally {
      setLoadingAction(prev => ({ ...prev, [id]: '' }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">
          Danh sách Mẻ Cắt (Packing Runs)
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm">
          Các mẻ cắt tổng hợp được tạo ra từ hệ thống Xếp Hình
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Mã Lượt (ID)</TableHead>
              <TableHead className="whitespace-nowrap">Tên Mẻ Cắt</TableHead>
              <TableHead className="whitespace-nowrap">Các loại phôi</TableHead>
              <TableHead className="whitespace-nowrap">Tổng số tấm</TableHead>
              <TableHead className="whitespace-nowrap">Tổng chi tiết</TableHead>
              <TableHead className="whitespace-nowrap">Trạng thái</TableHead>
              <TableHead className="whitespace-nowrap">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => {
              let totalSheets = 0;
              let totalItems = 0;
              if (run.batches && Array.isArray(run.batches)) {
                run.batches.forEach((b: any) => {
                  totalSheets += b.reports?.[0]?.totalSheets || 0;
                  totalItems += b._count?.items || 0;
                });
              }

              return (
                <TableRow key={run.id}>
                  <TableCell className="font-mono text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                    {run.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="font-semibold text-blue-800 whitespace-nowrap">
                    {run.name}
                    <div className="text-xs text-gray-400 font-normal mt-0.5">{new Date(run.createdAt).toLocaleString("vi-VN")}</div>
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    {run.batches?.length || 0} loại
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs sm:text-sm font-bold inline-block">
                      {totalSheets} Tấm
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{totalItems} Miếng</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {run.status === 'suggested' ? (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium inline-block">Đề xuất</span>
                    ) : run.status === 'saved' ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium inline-block">Đã chốt</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium inline-block">{run.status}</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/packing/batches/${run.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Chi tiết mẻ cắt"
                          className="h-8 w-8 p-0"
                        >
                          <Eye size={16} />
                        </Button>
                      </Link>
                      {run.status === 'suggested' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50" 
                          title="Lưu / Chốt mẻ cắt"
                          onClick={() => handleSave(run.id)}
                          disabled={loadingAction[run.id] === 'saving'}
                        >
                          <CheckCircle size={16} />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50" 
                        title="Xóa mẻ cắt"
                        onClick={() => handleDelete(run.id)}
                        disabled={loadingAction[run.id] === 'deleting'}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {runs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-500 text-sm"
                >
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

