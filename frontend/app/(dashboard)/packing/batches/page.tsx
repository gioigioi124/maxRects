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
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Danh sách Mẻ Cắt (Packing Runs)
          </h1>
          <p className="text-gray-500 text-sm">
            Các mẻ cắt tổng hợp được tạo ra từ hệ thống Xếp Hình
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã Lượt (ID)</TableHead>
              <TableHead>Tên Mẻ Cắt</TableHead>
              <TableHead>Các loại phôi</TableHead>
              <TableHead>Tổng số tấm</TableHead>
              <TableHead>Tổng chi tiết</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
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
                  <TableCell className="font-mono text-sm text-gray-600">
                    {run.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="font-semibold text-blue-800">
                    {run.name}
                    <div className="text-xs text-gray-400 font-normal mt-1">{new Date(run.createdAt).toLocaleString("vi-VN")}</div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {run.batches?.length || 0} loại
                  </TableCell>
                  <TableCell>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">
                      {totalSheets} Tấm
                    </span>
                  </TableCell>
                  <TableCell>{totalItems} Miếng</TableCell>
                  <TableCell>
                    {run.status === 'suggested' ? (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">Đề xuất</span>
                    ) : run.status === 'saved' ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Đã chốt</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">{run.status}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/packing/batches/${run.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          title="Chi tiết mẻ cắt"
                        >
                          <Eye size={16} />
                        </Button>
                      </Link>
                      {run.status === 'suggested' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-green-600 border-green-200 hover:bg-green-50" 
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
                        className="text-red-600 border-red-200 hover:bg-red-50" 
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
                  className="text-center py-8 text-gray-500"
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

