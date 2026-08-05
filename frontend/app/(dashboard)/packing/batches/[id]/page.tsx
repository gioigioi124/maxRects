'use client';
import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [batch, setBatch] = useState<any>(null);

  useEffect(() => {
    fetch(`http://localhost:3001/packing/batches/${resolvedParams.id}`)
      .then(res => res.json())
      .then(data => setBatch(data))
      .catch(console.error);
  }, [resolvedParams.id]);

  if (!batch) return <div className="p-6">Đang tải...</div>;

  // Group items by sheetIndex
  const sheets: Record<number, any[]> = {};
  batch.items.forEach((item: any) => {
    if (!sheets[item.sheetIndex]) sheets[item.sheetIndex] = [];
    sheets[item.sheetIndex].push(item);
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/packing/batches">
            <Button variant="outline" size="icon"><ArrowLeft size={20} /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sơ Đồ Cắt (Layout)</h1>
            <p className="text-gray-500">Mẻ cắt ID: {batch.id.substring(0,8)}... | {batch.material?.name} {batch.thickness}mm</p>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => window.print()}>
          <Printer className="mr-2" size={18} /> In Phiếu Cắt
        </Button>
      </div>

      <div className="space-y-12">
        {Object.entries(sheets).map(([sheetIndex, items]) => {
          // Parse sheetSize e.g. "160x200" -> 1600x2000
          const sheetSizeStr = items[0]?.sheetSize || '160x200';
          const parts = sheetSizeStr.split('x');
          const sheetWidth = Number(parts[0]) * 10;
          const sheetHeight = Number(parts[1]) * 10;

          return (
            <div key={sheetIndex} className="bg-white p-6 rounded-lg shadow-sm border print:shadow-none print:border-none print:p-0 print:break-after-page">
              <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                <span>Tấm phôi số #{Number(sheetIndex) + 1}</span>
                <span className="text-gray-500 font-medium text-sm">Khổ: {sheetWidth}x{sheetHeight} mm</span>
              </h2>

              {/* Bảng tóm tắt các chi tiết trên tấm phôi này */}
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm print:hidden">
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-gray-500 mb-1">Số lượng chi tiết</div>
                  <div className="font-bold text-lg">{items.length}</div>
                </div>
              </div>

              {/* Canvas hiển thị sơ đồ cắt bằng HTML div */}
              {/* Giữ aspect ratio của tấm phôi (Width / Height) */}
              <div 
                className="relative bg-gray-100 border-2 border-gray-800 shadow-inner mx-auto print:border-black print:bg-white"
                style={{ 
                  aspectRatio: `${sheetWidth} / ${sheetHeight}`,
                  maxHeight: '800px', // Không để nó quá to trên màn hình
                  width: '100%',
                  maxWidth: `${(sheetWidth/sheetHeight) * 800}px` 
                }}
              >
                {items.map((item, idx) => {
                  const left = (Number(item.x) / sheetWidth) * 100;
                  const top = (Number(item.y) / sheetHeight) * 100;
                  const width = (Number(item.w) / sheetWidth) * 100;
                  const height = (Number(item.h) / sheetHeight) * 100;

                  return (
                    <div
                      key={item.id}
                      className="absolute border-2 border-red-500 bg-red-100/50 flex flex-col items-center justify-center overflow-hidden group print:border-black print:bg-transparent"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                      }}
                    >
                      <span className="font-bold text-red-700 text-xs text-center px-1 print:text-black">
                        {item.partPiece?.partName || 'Chi tiết'}
                      </span>
                      <span className="text-red-600 text-[10px] text-center print:text-black">
                        {item.orderItem?.order?.orderCode}
                      </span>
                      {/* Hiển thị kích thước khi hover */}
                      <div className="hidden group-hover:flex absolute inset-0 bg-black/80 text-white flex-col items-center justify-center text-xs z-10 print:hidden">
                        <span>{item.w}x{item.h}</span>
                        {item.rotated && <span>(Xoay)</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
