'use client';
import React, { useEffect, useState, use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { API_BASE } from '@/lib/api-client';

function PrintContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'order'; // 'order' | 'all' | 'part'
  const partId = searchParams.get('partId');
  
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/orders/${id}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data);
        setTimeout(() => window.print(), 500);
      })
      .catch(console.error);
  }, [id]);

  if (!order) return <div className="p-6">Đang tải dữ liệu in...</div>;

  const renderOrderSummary = () => (
    <div className="p-8 bg-white print:p-0">
      <h1 className="text-3xl font-bold mb-2 text-center uppercase">Phiếu Yêu Cầu Sản Xuất</h1>
      <p className="text-center mb-8 text-gray-600">Mã Đơn: {order.orderCode}</p>
      
      <div className="mb-6 flex justify-between text-lg">
        <div><strong>Ngày tạo:</strong> {new Date(order.createdAt).toLocaleString('vi-VN')}</div>
        <div><strong>Trạng thái:</strong> {order.status}</div>
      </div>

      <Table className="border border-black print:border-black text-black">
        <TableHeader>
          <TableRow className="border-b border-black">
            <TableHead className="text-black font-bold border-r border-black">STT</TableHead>
            <TableHead className="text-black font-bold border-r border-black">Mã Hàng</TableHead>
            <TableHead className="text-black font-bold border-r border-black">Chi Tiết</TableHead>
            <TableHead className="text-black font-bold">Số lượng (Bộ)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.items.map((item: any, idx: number) => (
            <TableRow key={item.id} className="border-b border-black">
              <TableCell className="border-r border-black text-center">{idx + 1}</TableCell>
              <TableCell className="border-r border-black font-semibold">{item.productPart?.product?.code}</TableCell>
              <TableCell className="border-r border-black">{item.productPart?.partName}</TableCell>
              <TableCell className="font-bold text-center">{item.setQuantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderPartDetails = (item: any, index?: number, total?: number) => {
    const part = item.productPart;
    if (!part) return null;
    const isLast = index !== undefined && total !== undefined ? index === total - 1 : true;
    
    return (
      <div className={`p-8 bg-white print:p-0 ${!isLast ? 'print:break-after-page' : ''}`} key={item.id}>
        <div className="mb-6 border-b-2 border-black pb-4">
          <h2 className="text-2xl font-bold uppercase">Chi Tiết Sản Xuất: {part.partName}</h2>
          <div className="flex justify-between mt-2 text-lg">
            <span><strong>Mã Hàng:</strong> {part.product?.code}</span>
            <span><strong>Số Lượng Đặt:</strong> {item.setQuantity} Bộ</span>
            <span><strong>Đơn Hàng:</strong> {order.orderCode}</span>
          </div>
        </div>

        <Table className="border border-black print:border-black text-black">
          <TableHeader>
            <TableRow className="border-b border-black">
              <TableHead className="text-black font-bold border-r border-black text-center">Cạnh 1</TableHead>
              <TableHead className="text-black font-bold border-r border-black text-center">Cạnh 2</TableHead>
              <TableHead className="text-black font-bold border-r border-black text-center">Cạnh 3</TableHead>
              <TableHead className="text-black font-bold border-r border-black text-center">Mút</TableHead>
              <TableHead className="text-black font-bold border-r border-black text-center">Cắt Khổ (Dày x R x D)</TableHead>
              <TableHead className="text-black font-bold text-center">Tổng SL (Miếng)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {part.pieces.map((piece: any) => (
              <TableRow key={piece.id} className="border-b border-black">
                <TableCell className="border-r border-black text-center">{piece.edge1}</TableCell>
                <TableCell className="border-r border-black text-center">{piece.edge2}</TableCell>
                <TableCell className="border-r border-black text-center">{piece.edge3}</TableCell>
                <TableCell className="border-r border-black text-center font-semibold">{piece.material?.name}</TableCell>
                <TableCell className="border-r border-black text-center font-bold text-blue-800 print:text-black">
                  {piece.thickness ?? Math.min(piece.edge1, piece.edge2, piece.edge3)} x {piece.width} x {piece.height}
                </TableCell>
                <TableCell className="text-center font-bold text-lg">
                  {piece.quantity * item.setQuantity}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body { background: white; margin: 0; padding: 0; }
          td, th { padding: 4px 8px !important; height: auto !important; }
        }
      `}} />
      
      {type === 'order' && renderOrderSummary()}
      {type === 'part' && partId && renderPartDetails(order.items.find((i: any) => i.productPart?.id === partId))}
      {type === 'all' && (
        <div className="flex flex-col">
          {order.items.map((item: any, index: number) => renderPartDetails(item, index, order.items.length))}
        </div>
      )}
    </div>
  );
}

export default function PrintOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PrintContent id={resolvedParams.id} />
    </Suspense>
  );
}
