'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { API_BASE } from '@/lib/api-client';
import { downloadOrderTemplate } from '@/lib/excel-template';

export default function NewOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [orderCode, setOrderCode] = useState('');
  
  const [items, setItems] = useState<{ productPartId: string, setQuantity: number, productCode: string, partName: string }[]>([]);
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  useEffect(() => {
    fetch(`${API_BASE}/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(console.error);
  }, []);

  const handleAddItem = () => {
    if (!selectedProductId || !selectedPartId || selectedQuantity < 1) return;
    const product = products.find(p => p.id === selectedProductId);
    const part = product?.parts?.find((p: any) => p.id === selectedPartId);
    if (!product || !part) return;
    
    if (items.find(i => i.productPartId === selectedPartId)) {
      alert('Chi tiết này đã được thêm vào đơn hàng!');
      return;
    }

    setItems([...items, { productPartId: part.id, setQuantity: selectedQuantity, productCode: product.code, partName: part.partName }]);
    setSelectedPartId('');
    setSelectedQuantity(1);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.productPartId !== id));
  };

  const handleSave = async () => {
    if (!orderCode) return alert('Vui lòng nhập mã đơn hàng');
    if (items.length === 0) return alert('Vui lòng thêm ít nhất 1 chi tiết');

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode,
          items: items.map(i => ({ productPartId: i.productPartId, setQuantity: i.setQuantity }))
        })
      });
      if (res.ok) {
        router.push('/orders');
      } else {
        const err = await res.json();
        alert('Lỗi: ' + err.error);
      }
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi lưu đơn hàng');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

      let newItems = [...items];
      let notFound: string[] = [];

      for (const row of rows) {
        const productCode = (row['Mã hàng'] || row['mã hàng'])?.toString().trim();
        const partName = (row['Chi tiết'] || row['chi tiết'])?.toString().trim();
        const quantity = parseInt(row['Số lượng'] || row['số lượng'], 10);

        if (!productCode || !partName || isNaN(quantity)) continue;

        const product = products.find(p => p.code === productCode);
        if (product) {
          const part = product.parts?.find((p: any) => p.partName === partName);
          if (part) {
            if (!newItems.find(i => i.productPartId === part.id)) {
              newItems.push({
                productPartId: part.id,
                setQuantity: quantity,
                productCode: product.code,
                partName: part.partName
              });
            }
          } else {
            notFound.push(`${productCode} - ${partName}`);
          }
        } else {
          notFound.push(productCode);
        }
      }

      setItems(newItems);
      if (notFound.length > 0) {
        alert(`Đã thêm thành công, nhưng không tìm thấy các chi tiết sau trong hệ thống: ${notFound.join(', ')}`);
      }
      // reset file input
      e.target.value = '';
    } catch (err) {
      console.error(err);
      alert('Lỗi khi đọc file Excel');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <Link href="/orders" className="inline-flex items-center text-sm text-blue-600 hover:underline">
          <ArrowLeft size={16} className="mr-1" /> Quay lại danh sách
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Tạo Đơn hàng mới</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Mã Đơn hàng (PO/Invoice)</label>
          <Input 
            value={orderCode} 
            onChange={(e) => setOrderCode(e.target.value)} 
            placeholder="Ví dụ: PO-2026-08-01"
            className="w-full sm:max-w-md"
          />
        </div>

        <div className="border-t pt-6 mb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">Thêm sản phẩm vào đơn</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button 
                variant="outline" 
                type="button" 
                size="sm"
                onClick={downloadOrderTemplate}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5"
              >
                <Download size={15} /> Tải file Excel mẫu
              </Button>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                id="excel-upload" 
                className="hidden" 
                onChange={handleFileUpload} 
              />
              <Button 
                variant="outline" 
                type="button" 
                size="sm"
                onClick={() => document.getElementById('excel-upload')?.click()}
                className="w-full sm:w-auto"
              >
                Nhập từ file Excel
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-gray-50 p-4 rounded-lg border">
            <div className="w-full">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Chọn Mã hàng</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setSelectedPartId('');
                }}
              >
                <option value="">-- Chọn mã hàng --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.code}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Chọn Chi tiết</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(e.target.value)}
                disabled={!selectedProductId}
              >
                <option value="">-- Chọn chi tiết --</option>
                {products.find(p => p.id === selectedProductId)?.parts?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.partName}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Số lượng (Bộ)</label>
              <Input 
                type="number" 
                min="1" 
                value={selectedQuantity} 
                onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)} 
                className="w-full"
              />
            </div>
            <Button onClick={handleAddItem} variant="secondary" className="w-full flex items-center justify-center gap-2">
              <Plus size={16} /> Thêm vào đơn
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã hàng</TableHead>
              <TableHead>Chi tiết</TableHead>
              <TableHead>Số lượng / Bộ</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.productPartId}>
                <TableCell className="font-semibold text-gray-900">{item.productCode}</TableCell>
                <TableCell>{item.partName}</TableCell>
                <TableCell className="font-bold">{item.setQuantity}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.productPartId)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2">
                    <Trash2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  Chưa có chi tiết nào trong đơn hàng.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {items.length > 0 && (
          <div className="p-4 bg-gray-50 border-t flex justify-end">
            <Button onClick={handleSave} className="w-full sm:w-auto flex items-center justify-center gap-2">
              <Save size={16} /> Lưu Đơn Hàng
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
