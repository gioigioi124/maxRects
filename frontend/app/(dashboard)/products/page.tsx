'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('http://localhost:3001/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = products.filter(p => p.code.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mã hàng ${code} không?`)) return;
    
    setDeleting(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`http://localhost:3001/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Lỗi khi xóa mã hàng.');
      }
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra.');
    } finally {
      setDeleting(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Danh sách Mã hàng</h1>
        <Link 
          href="/products/import" 
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus size={20} /> Thêm Mã hàng (Excel)
        </Link>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Tìm kiếm mã hàng..." 
          className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{product.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <Link href={`/products/${product.id}`} className="text-blue-600 hover:text-blue-800">
                        Xem chi tiết
                      </Link>
                      <button 
                        onClick={() => handleDelete(product.id, product.code)}
                        disabled={deleting[product.id]}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        {deleting[product.id] ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">Không tìm thấy mã hàng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
