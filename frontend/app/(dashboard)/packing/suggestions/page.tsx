"use client";
import React, { useEffect, useState } from "react";
import { Lightbulb, Scissors, CheckSquare, Square, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API_BASE } from "@/lib/api-client";

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [packing, setPacking] = useState(false);
  const [packingProgress, setPackingProgress] = useState<number>(0);
  const [packingStatusText, setPackingStatusText] = useState<string>("");
  const [kerf, setKerf] = useState<number>(3);
  const [sheetNames, setSheetNames] = useState<string[]>(['160x200', '180x200', '160x215']);
  const [optimizationMode, setOptimizationMode] = useState<"GUILLOTINE" | "AREA">("GUILLOTINE");

  useEffect(() => {
    // Lấy gợi ý
    fetch(`${API_BASE}/packing/suggestions`)
      .then((res) => res.json())
      .then((data) => {
        setSuggestions(data);
        setLoadingSuggestions(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingSuggestions(false);
      });

    // Lấy danh sách đơn hàng chưa cắt
    fetch(`${API_BASE}/orders`)
      .then((res) => res.json())
      .then((data) => {
        // Lọc các đơn hàng chưa bị cắt hết
        const pendingOrders = data.filter(
          (o: any) => o.status === "draft" || o.status === "processing",
        );
        setOrders(pendingOrders);
      })
      .catch(console.error);
  }, []);

  const toggleOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((oid) => oid !== id) : [...prev, id],
    );
  };

  const handleRunPacking = async () => {
    if (selectedOrderIds.length === 0) {
      alert("Vui lòng chọn ít nhất 1 đơn hàng để tiến hành xếp mút.");
      return;
    }

    setPacking(true);
    setPackingProgress(5);
    setPackingStatusText("Bắt đầu khởi tạo xếp mút...");

    const progressInterval = setInterval(() => {
      setPackingProgress((prev) => {
        if (prev >= 92) return prev;
        const inc = Math.random() * 10 + 4;
        const next = Math.min(prev + inc, 92);

        if (next < 30) {
          setPackingStatusText("Đang tổng hợp dữ liệu đơn hàng & phôi...");
        } else if (next < 60) {
          setPackingStatusText("Đang phân tích kích thước chi tiết mút...");
        } else if (next < 85) {
          setPackingStatusText("Đang chạy thuật toán tính toán sơ đồ cắt tối ưu...");
        } else {
          setPackingStatusText("Đang tổng hợp các mẻ cắt & lưu kết quả...");
        }
        return next;
      });
    }, 180);

    try {
      const res = await fetch(`${API_BASE}/packing/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedOrderIds, kerf, sheetNames, optimizationMode }),
      });
      const data = await res.json();

      clearInterval(progressInterval);

      if (res.ok) {
        setPackingProgress(100);
        setPackingStatusText(`Hoàn tất! Đã tạo thành công ${data.batches?.length || 0} mẻ cắt.`);

        await new Promise((resolve) => setTimeout(resolve, 600));

        alert(
          "Chạy thành công! Đã tạo ra " + data.batches?.length + " mẻ cắt.",
        );
        // Refresh orders and selected
        setSelectedOrderIds([]);
        const ordersRes = await fetch(`${API_BASE}/orders`);
        const ordersData = await ordersRes.json();
        setOrders(
          ordersData.filter(
            (o: any) => o.status === "draft" || o.status === "processing",
          ),
        );
      } else {
        alert("Lỗi: " + data.error);
      }
    } catch (e) {
      clearInterval(progressInterval);
      console.error(e);
      alert("Có lỗi xảy ra trong quá trình xếp mút.");
    } finally {
      setPacking(false);
      setPackingProgress(0);
      setPackingStatusText("");
    }
  };

  const handleApplySuggestion = (orderCodes: string[]) => {
    const idsToSelect = orders
      .filter((o) => orderCodes.includes(o.orderCode))
      .map((o) => o.id);
    setSelectedOrderIds((prev) => {
      const newSet = new Set([...prev, ...idsToSelect]);
      return Array.from(newSet);
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
          Gợi Ý & Xếp Hình (Packing)
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm">
          Hệ thống sẽ tự động ghép các chi tiết cùng loại mút và độ dày để tối
          ưu hoá việc sử dụng phôi.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-amber-800 flex items-center gap-2 mb-4">
          <Lightbulb className="text-amber-500" size={20} />
          Gợi ý gộp đơn tiện lợi
        </h2>

        {loadingSuggestions ? (
          <p className="text-amber-700 text-xs sm:text-sm">Đang phân tích dữ liệu...</p>
        ) : suggestions.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-3.5 sm:p-4 border border-amber-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm"
              >
                <div>
                  <p className="text-gray-800 font-medium text-xs sm:text-sm">{s.message}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-amber-700 border-amber-300 hover:bg-amber-100 w-full sm:w-auto"
                  onClick={() => handleApplySuggestion(s.orderCodes)}
                >
                  Áp dụng (Chọn)
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-amber-700 text-xs sm:text-sm">
            Không có gợi ý gộp đơn nào tối ưu tại thời điểm này.
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Cài đặt thông số Xếp hình</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Khoảng cách giữa các nhát cắt (Kerf / mm)
            </label>
            <input 
              type="number" 
              className="w-full border rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
              value={kerf} 
              onChange={e => setKerf(Number(e.target.value))} 
              min={0}
            />
            <p className="text-xs text-gray-500 mt-1">Độ dày lưỡi cưa hoặc khoảng cách tối thiểu giữa các chi tiết.</p>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Kích thước tấm phôi ưu tiên
            </label>
            <div className="space-y-2">
              {['160x200', '180x200', '160x215'].map(size => (
                <label key={size} className="flex items-center gap-2 cursor-pointer py-0.5">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    checked={sheetNames.includes(size)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSheetNames(prev => [...prev, size]);
                      } else {
                        setSheetNames(prev => prev.filter(s => s !== size));
                      }
                    }}
                  />
                  <span className="text-xs sm:text-sm text-gray-800">
                    {size === '160x215' ? '1600x2150 (Ngoại cỡ)' : `${size.split('x')[0]}0x${size.split('x')[1]}0`}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">Lưu ý: Mút EP hệ thống sẽ tự động ép dùng khổ 1600x2000.</p>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Chiến lược tối ưu cắt
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="optMode"
                  className="mt-0.5 text-blue-600 focus:ring-blue-500 w-4 h-4 flex-shrink-0"
                  checked={optimizationMode === "GUILLOTINE"}
                  onChange={() => setOptimizationMode("GUILLOTINE")}
                />
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 block">Ưu tiên đường thẳng dài (Guillotine)</span>
                  <span className="text-xs text-gray-500">Giúp thợ dễ cắt, chẻ phôi thẳng tuột, tiết kiệm công thợ.</span>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="optMode"
                  className="mt-0.5 text-blue-600 focus:ring-blue-500 w-4 h-4 flex-shrink-0"
                  checked={optimizationMode === "AREA"}
                  onChange={() => setOptimizationMode("AREA")}
                />
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 block">Tối ưu khít diện tích tuyệt đối</span>
                  <span className="text-xs text-gray-500">Tự động xoay lộn xộn để nhét được nhiều chi tiết nhất, tiết kiệm mút tối đa.</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
        <div className="p-4 bg-gray-50 border-b flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
            Danh sách Đơn hàng chờ xử lý
          </h2>
          <span className="text-xs sm:text-sm text-gray-500">
            Đã chọn:{" "}
            <span className="font-bold text-blue-600">
              {selectedOrderIds.length}
            </span>{" "}
            đơn hàng
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">Chọn</TableHead>
              <TableHead>Mã Đơn Hàng</TableHead>
              <TableHead>Ngày Tạo</TableHead>
              <TableHead>Trạng Thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow
                key={o.id}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleOrder(o.id)}
              >
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    {selectedOrderIds.includes(o.id) ? (
                      <CheckSquare className="text-blue-600" size={20} />
                    ) : (
                      <Square className="text-gray-400" size={20} />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-gray-800">
                  {o.orderCode}
                </TableCell>
                <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                  {new Date(o.createdAt).toLocaleString("vi-VN")}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold inline-block ${
                      o.status === "draft"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {o.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-gray-500"
                >
                  Không có đơn hàng nào đang chờ.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {packing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm transition-all duration-300">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs sm:text-sm font-semibold text-blue-900 flex items-center gap-2">
              {packingProgress < 100 ? (
                <Loader2 className="animate-spin text-blue-600 flex-shrink-0" size={18} />
              ) : (
                <CheckCircle2 className="text-green-600 flex-shrink-0" size={18} />
              )}
              {packingStatusText}
            </span>
            <span className="text-xs sm:text-sm font-bold text-blue-700 ml-2">
              {Math.round(packingProgress)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                packingProgress === 100 ? "bg-green-600" : "bg-blue-600"
              }`}
              style={{ width: `${packingProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          size="lg"
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md text-sm sm:text-base py-3 sm:py-3.5"
          onClick={handleRunPacking}
          disabled={packing || selectedOrderIds.length === 0}
        >
          {packing ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Đang xếp hình ({Math.round(packingProgress)}%)...</span>
            </>
          ) : (
            <>
              <Scissors size={20} />
              <span>Tiến hành Xếp Hình (Run Packing)</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
