"use client";
import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [batch, setBatch] = useState<any>(null);

  useEffect(() => {
    fetch(`http://localhost:3001/packing/batches/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((data) => setBatch(data))
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
    <div className="max-w-7xl mx-auto p-6 print:p-0">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/packing/batches">
            <Button variant="outline" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Sơ Đồ Cắt (Layout)
            </h1>
            <p className="text-gray-500">
              Mẻ cắt ID: {batch.id.substring(0, 8)}... | {batch.material?.name}{" "}
              {batch.thickness}mm
            </p>
          </div>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 print:hidden"
          onClick={() => window.print()}
        >
          <Printer className="mr-2" size={18} /> In Phiếu Cắt
        </Button>
      </div>

      <div className="space-y-12">
        {Object.entries(sheets).map(([sheetIndex, items], arrIndex, arr) => {
          // Parse sheetSize e.g. "160x200" -> 1600x2000
          const sheetSizeStr = items[0]?.sheetSize || "160x200";
          const parts = sheetSizeStr.split("x");
          const sheetWidth = Number(parts[0]) * 10;
          const sheetHeight = Number(parts[1]) * 10;

          return (
            <div
              key={sheetIndex}
              className={`bg-white p-6 rounded-lg shadow-sm border print:shadow-none print:border-none print:p-0 ${
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
}
