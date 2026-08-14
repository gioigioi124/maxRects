"use client";
import React, { useEffect, useState, use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { API_BASE } from "@/lib/api-client";

export default function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [run, setRun] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"TABLE" | "ALL" | string>("TABLE");

  useEffect(() => {
    fetch(`${API_BASE}/packing/batches/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((data) => setRun(data))
      .catch(console.error);
  }, [resolvedParams.id]);

  useEffect(() => {
    if (viewMode === "ALL") {
      // Delay printing slightly to allow render to finish
      setTimeout(() => window.print(), 500);
    }
  }, [viewMode]);

  const sortedBatches = run?.batches ? [...run.batches].sort((a: any, b: any) => {
    const matA = a.material?.name || '';
    const matB = b.material?.name || '';
    if (matA < matB) return -1;
    if (matA > matB) return 1;
    return (a.thickness || 0) - (b.thickness || 0);
  }) : [];

  const summaryByMaterial = useMemo(() => {
    if (!run?.batches) return [];

    const map = new Map<string, {
      materialName: string;
      totalSheets: number;
      totalVolumeOriginal: number; // m3
      totalVolumeParts: number; // m3
    }>();

    for (const batch of run.batches) {
      const matName = batch.material?.name || 'Unknown';
      if (!map.has(matName)) {
        map.set(matName, { materialName: matName, totalSheets: 0, totalVolumeOriginal: 0, totalVolumeParts: 0 });
      }
      const stat = map.get(matName)!;

      const thickness = batch.thickness || 0; // in mm

      // Items array contains rects. We need to group by sheetIndex to count sheets and original sheet sizes.
      const sheetsMap = new Map<number, string>();
      let partsArea = 0; // mm2

      for (const item of batch.items || []) {
        sheetsMap.set(item.sheetIndex, item.sheetSize);
        partsArea += (item.w * item.h);
      }

      stat.totalSheets += sheetsMap.size;
      stat.totalVolumeParts += (partsArea * thickness) / 1000000000;

      let originalArea = 0; // mm2
      for (const sheetSizeStr of sheetsMap.values()) {
        const parts = (sheetSizeStr || "160x200").split("x");
        const w = Number(parts[0]) * 10;
        const h = Number(parts[1]) * 10;
        originalArea += (w * h);
      }
      stat.totalVolumeOriginal += (originalArea * thickness) / 1000000000;
    }

    return Array.from(map.values()).sort((a, b) => a.materialName.localeCompare(b.materialName));
  }, [run]);

  if (!run) return <div className="p-4 sm:p-6 text-sm text-gray-500">Đang tải...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 print:p-0">
      <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/packing/batches">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Sơ Đồ Cắt (Layout) - {run.name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Mã Lượt: {run.id.substring(0, 8)}... | Bao gồm {run.batches?.length || 0} loại phôi
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
          {viewMode === "TABLE" ? (
            <Button
              className="bg-green-600 hover:bg-green-700 print:hidden w-full sm:w-auto text-sm"
              onClick={() => setViewMode("ALL")}
            >
              <Printer className="mr-2" size={16} /> In phiếu cắt tổng hợp
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="print:hidden text-sm flex-1 sm:flex-none"
                onClick={() => setViewMode("TABLE")}
              >
                <ArrowLeft className="mr-1.5" size={16} /> Quay lại bảng
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 print:hidden text-sm flex-1 sm:flex-none"
                onClick={() => window.print()}
              >
                <Printer className="mr-1.5" size={16} /> 
                {viewMode === "ALL" ? "In Tất Cả" : "In Phiếu Cắt"}
              </Button>
            </>
          )}
        </div>
      </div>

      {viewMode === "TABLE" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-blue-50 border-b px-4 py-3 font-semibold text-blue-900 border-blue-100 flex items-center justify-between">
              <span>Tổng hợp vật tư (Theo chất liệu)</span>
            </div>
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Chất liệu</TableHead>
                  <TableHead className="text-right">Tổng số phôi (Tấm)</TableHead>
                  <TableHead className="text-right">Khối lượng phôi (m³)</TableHead>
                  <TableHead className="text-right">Khối lượng chi tiết (m³)</TableHead>
                  <TableHead className="text-right">Hao hụt (m³)</TableHead>
                  <TableHead className="text-right">Tỉ lệ SD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryByMaterial.map(s => (
                  <TableRow key={s.materialName}>
                    <TableCell className="font-bold text-blue-800">{s.materialName}</TableCell>
                    <TableCell className="text-right font-bold text-gray-800">{s.totalSheets}</TableCell>
                    <TableCell className="text-right font-bold text-amber-600">{s.totalVolumeOriginal.toFixed(3)}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">{s.totalVolumeParts.toFixed(3)}</TableCell>
                    <TableCell className="text-right font-bold text-red-600">{ (s.totalVolumeOriginal - s.totalVolumeParts).toFixed(3) }</TableCell>
                    <TableCell className="text-right font-bold">{ s.totalVolumeOriginal > 0 ? ((s.totalVolumeParts / s.totalVolumeOriginal) * 100).toFixed(1) : 0 }%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-gray-50 border-b px-4 py-3 font-semibold text-gray-800">Chi tiết các mẻ cắt</div>
            <Table>

            <TableHeader>
              <TableRow>
                <TableHead>Chất liệu</TableHead>
                <TableHead>Độ dày (mm)</TableHead>
                <TableHead>Số lượng tấm phôi</TableHead>
                <TableHead>Hiệu suất SD</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBatches.map((batch: any) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-semibold text-blue-800">
                    {batch.material?.name}
                  </TableCell>
                  <TableCell className="font-bold">{batch.thickness}</TableCell>
                  <TableCell>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">
                      {batch.reports?.[0]?.totalSheets || 0} Tấm
                    </span>
                  </TableCell>
                  <TableCell>
                    {batch.reports?.[0]?.utilizationPct
                      ? Number(batch.reports[0].utilizationPct).toFixed(1)
                      : 0}
                    %
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewMode(batch.id)}
                    >
                      Xem & In lẻ
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      )}

      {viewMode !== "TABLE" && (
        <div className="space-y-12">
          {sortedBatches
            .filter((b: any) => viewMode === "ALL" || b.id === viewMode)
            .map((batch: any, batchIndex: number) => {
              // Group items by sheetIndex for this specific batch
              const sheets: Record<number, any[]> = {};
              batch.items?.forEach((item: any) => {
                if (!sheets[item.sheetIndex]) sheets[item.sheetIndex] = [];
                sheets[item.sheetIndex].push(item);
              });

              return (
                <div key={batch.id} className={`batch-section ${batchIndex > 0 && viewMode === "ALL" ? 'print:break-before-page' : ''}`}>
                  {viewMode === "ALL" && (
                    <div className="bg-gray-800 text-white p-3 font-bold rounded-t-lg print:text-black print:bg-gray-200">
                      Phần {batchIndex + 1}: {batch.material?.name} - {batch.thickness}mm
                    </div>
                  )}
                  <div className={`space-y-8 ${viewMode === "ALL" ? 'p-4 border border-t-0 rounded-b-lg' : ''}`}>
                    {Object.entries(sheets).map(([sheetIndex, items], arrIndex, arr) => {
                      const sheetSizeStr = items[0]?.sheetSize || "160x200";
                      const parts = sheetSizeStr.split("x");
                      const sheetWidth = Number(parts[0]) * 10;
                      const sheetHeight = Number(parts[1]) * 10;

          return (
            <div
              key={sheetIndex}
              className={`bg-white p-6 rounded-lg shadow-sm border print:shadow-none print:border-none print:p-0 print:break-inside-avoid ${
                arrIndex < arr.length - 1 ? "print:break-after-page" : ""
              }`}
            >
              <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                <span>Tấm phôi số #{Number(sheetIndex) + 1}</span>
                <span className="text-gray-500 font-medium text-sm print:text-black">
                  {batch.material?.name} - {batch.thickness}x{sheetWidth}x
                  {sheetHeight}mm
                </span>
              </h2>

              {/* Bảng tóm tắt các chi tiết trên tấm phôi này */}
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm print:hidden">
                <div className="bg-gray-50 p-3 rounded border">
                  <div className="text-gray-500 mb-1">Số lượng chi tiết</div>
                  <div className="font-bold text-lg">{items.length}</div>
                </div>
              </div>

              {/* Group items to show in table */}
              {(() => {
                const groupedItems = Object.values(
                  items.reduce((acc: any, item: any) => {
                    const prodCode =
                      item.partPiece?.productPart?.product?.code || "";
                    const ptName =
                      item.partPiece?.productPart?.partName || "Chi tiết";
                    const fullPartName = prodCode
                      ? `${prodCode} ${ptName}`
                      : ptName;

                    const key = `${item.orderItem?.order?.orderCode}-${fullPartName}-${item.w}x${item.h}`;
                    if (!acc[key]) {
                      acc[key] = {
                        orderCode: item.orderItem?.order?.orderCode,
                        partName: fullPartName,
                        w: item.w,
                        h: item.h,
                        quantity: 0,
                      };
                    }
                    acc[key].quantity += 1;
                    return acc;
                  }, {}),
                );

                return (
                  <div className="flex flex-col print:flex-col lg:flex-row gap-8 print:gap-2">
                    {/* Phần Sơ đồ */}
                    <div className="flex-1">
                      <div className="font-semibold mb-2 print:hidden">
                        Sơ đồ cắt
                      </div>
                      {/* Canvas hiển thị sơ đồ cắt bằng HTML div */}
                      <div
                        className="relative bg-gray-100 border-2 border-gray-800 shadow-inner mx-auto print:border-black print:bg-white w-full max-w-[600px] print:max-w-[550px]"
                        style={{
                          aspectRatio: `${sheetWidth} / ${sheetHeight}`,
                        }}
                      >
                        {items.map((item, idx) => {
                          const actualW = item.rotated
                            ? Number(item.h)
                            : Number(item.w);
                          const actualH = item.rotated
                            ? Number(item.w)
                            : Number(item.h);
                          const left = (Number(item.x) / sheetWidth) * 100;
                          const top = (Number(item.y) / sheetHeight) * 100;
                          const width = (actualW / sheetWidth) * 100;
                          const height = (actualH / sheetHeight) * 100;

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
                              <div className="text-center px-1 leading-tight break-words max-w-full">
                                {item.orderItem?.order?.orderCode && (
                                  <span className="text-[7px] font-normal text-red-600 print:text-[8px] print:text-black">
                                    {item.orderItem.order.orderCode} -
                                  </span>
                                )}
                                <span className="font-bold text-red-700 text-[9px] print:text-black print:text-[10px] ml-0.5">
                                  {[
                                    item.partPiece?.productPart?.product?.code,
                                    item.partPiece?.productPart?.partName,
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                </span>
                              </div>
                              {/* Hiển thị kích thước khi in */}
                              <div className="hidden print:flex flex-col items-center text-[9px] text-black font-medium leading-tight mt-0.5">
                                <span>
                                  {item.w}x{item.h}
                                </span>
                              </div>
                              {/* Hiển thị kích thước khi hover */}
                              <div className="hidden group-hover:flex absolute inset-0 bg-black/80 text-white flex-col items-center justify-center text-xs z-10 print:hidden">
                                <span>
                                  {item.w}x{item.h}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Phần Bảng danh sách chi tiết */}
                    <div className="lg:w-1/3 print:w-full print:mt-2">
                      <div className="font-bold mb-1 pb-1 border-b-2 print:border-black text-sm">
                        Danh sách chi tiết (Tấm #{Number(sheetIndex) + 1} -
                        Tổng: {items.length} chi tiết)
                      </div>

                      {/* Header cho cột */}
                      <div className="flex font-semibold text-xs border-b print:border-black pb-1 mb-1 print:text-[10px]">
                        <div className="w-1/3">Đơn hàng</div>
                        <div className="w-1/2">Tên chi tiết (K.thước)</div>
                        <div className="w-1/6 text-right">SL</div>
                      </div>

                      <div className="columns-1 print:columns-2 gap-x-8 text-xs print:text-[10px] print:leading-tight">
                        {groupedItems.map((gItem: any, i: number) => (
                          <div
                            key={i}
                            className="break-inside-avoid flex border-b border-gray-100 print:border-gray-300 py-1 print:py-[2px]"
                          >
                            <div className="w-1/3 truncate pr-2 text-gray-600 print:text-black">
                              {gItem.orderCode}
                            </div>
                            <div className="w-1/2 truncate pr-2 font-medium">
                              {gItem.partName} ({gItem.w}x{gItem.h})
                            </div>
                            <div className="w-1/6 text-right font-bold text-blue-600 print:text-black">
                              {gItem.quantity}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
