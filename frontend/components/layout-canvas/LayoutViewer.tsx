'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Printer, ChevronDown, ChevronUp } from 'lucide-react';
import type { SheetItem } from './SheetCanvas';

const SheetCanvas = dynamic(() => import('./SheetCanvas'), { ssr: false });

interface LayoutViewerProps {
  batchId: string;
}

interface BatchData {
  id: string;
  material: { name: string };
  thickness: number;
  items: Array<{
    id: string;
    sheetIndex: number;
    sheetSize: string;
    x: number;
    y: number;
    w: number;
    h: number;
    rotated: boolean;
    orderItem: { order: { orderCode: string } };
    partPiece: { productPart: { partName: string } };
  }>;
  reports: Array<{
    totalSheets: number;
    utilizationPct: number | null;
    totalVolumeM3: number | null;
  }>;
}

export default function LayoutViewer({ batchId }: LayoutViewerProps) {
  const [batch, setBatch] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSheets, setExpandedSheets] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    fetch(`http://localhost:3001/packing/batches/${batchId}`)
      .then(res => res.json())
      .then(data => {
        setBatch(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [batchId]);

  if (loading) return <div className="p-6 text-center text-gray-500">Đang tải layout...</div>;
  if (!batch) return <div className="p-6 text-center text-red-500">Không tìm thấy batch!</div>;

  // Group items by sheetIndex
  const sheetMap = new Map<number, BatchData['items']>();
  for (const item of batch.items) {
    const list = sheetMap.get(item.sheetIndex) || [];
    list.push(item);
    sheetMap.set(item.sheetIndex, list);
  }

  const report = batch.reports?.[0];
  const totalSheets = report?.totalSheets || sheetMap.size;

  const toggleSheet = (idx: number) => {
    setExpandedSheets(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {batch.material?.name} - Dày {batch.thickness}mm
            </h2>
            <p className="text-sm text-gray-500">Batch ID: {batch.id.substring(0, 8)}...</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Printer size={18} /> In báo cáo
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="text-sm text-blue-600 font-medium">Tổng số phôi</div>
            <div className="text-2xl font-bold text-blue-800">{totalSheets}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
            <div className="text-sm text-green-600 font-medium">Hiệu suất</div>
            <div className="text-2xl font-bold text-green-800">
              {report?.utilizationPct ? `${Number(report.utilizationPct).toFixed(1)}%` : 'N/A'}
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
            <div className="text-sm text-purple-600 font-medium">Tổng chi tiết</div>
            <div className="text-2xl font-bold text-purple-800">{batch.items.length}</div>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
            <div className="text-sm text-amber-600 font-medium">Thể tích</div>
            <div className="text-2xl font-bold text-amber-800">
              {report?.totalVolumeM3 ? `${Number(report.totalVolumeM3).toFixed(3)} m³` : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Sheets */}
      {Array.from(sheetMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([sheetIdx, items]) => {
          const sheetSizeStr = items[0]?.sheetSize || '160x200';
          const [sw, sh] = sheetSizeStr.split('x').map(Number);
          const sheetWidth = sw * 10; // cm -> mm
          const sheetHeight = sh * 10;

          const sheetItems: SheetItem[] = items.map(item => ({
            id: item.id,
            x: Number(item.x),
            y: Number(item.y),
            w: Number(item.w),
            h: Number(item.h),
            rotated: item.rotated,
            label: item.partPiece?.productPart?.partName || '',
            sublabel: item.orderItem?.order?.orderCode || '',
          }));

          const isExpanded = expandedSheets.has(sheetIdx);

          return (
            <div key={sheetIdx} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <button
                onClick={() => toggleSheet(sheetIdx)}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-gray-800">Tấm phôi #{sheetIdx + 1}</h3>
                  <span className="text-sm text-gray-500">Khổ: {sheetSizeStr}</span>
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {items.length} chi tiết
                  </span>
                </div>
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {isExpanded && (
                <div className="p-6">
                  <SheetCanvas
                    sheetWidth={sheetWidth}
                    sheetHeight={sheetHeight}
                    items={sheetItems}
                    sheetLabel={`Tấm #${sheetIdx + 1} - ${sheetSizeStr}`}
                  />
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}