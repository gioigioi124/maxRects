'use client';
import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit2, Trash2, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/api-client';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_BASE}/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        if (data && !data.error) {
          setEditCode(data.code);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    if (!editCode.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: editCode.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setProduct((prev: any) => ({ ...prev, code: data.code }));
        setIsEditing(false);
      } else {
        alert(data.error || 'Lỗi khi cập nhật.');
      }
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa mã hàng này không? Tất cả các chi tiết của mã hàng sẽ bị xóa theo.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/products');
      } else {
        const data = await res.json();
        alert(data.error || 'Lỗi khi xóa.');
        setDeleting(false);
      }
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra.');
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-4 sm:p-6 text-sm text-gray-500">Đang tải...</div>;
  if (!product || product.error) return <div className="p-4 sm:p-6 text-red-500 font-medium">Không tìm thấy mã hàng!</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <Link href="/products" className="inline-flex items-center text-sm text-blue-600 hover:underline">
          <ArrowLeft size={16} className="mr-1" /> Quay lại danh sách
        </Link>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto">
          {isEditing ? (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xl sm:text-2xl font-bold text-gray-800">Mã hàng:</span>
              <input 
                type="text" 
                value={editCode}
                onChange={e => setEditCode(e.target.value)}
                className="border rounded px-2 py-1 text-base sm:text-lg font-bold max-w-[180px] sm:max-w-xs focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                  title="Lưu"
                >
                  <Check size={20} />
                </button>
                <button 
                  onClick={() => { setIsEditing(false); setEditCode(product.code); }}
                  disabled={saving}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                  title="Hủy"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Mã hàng: {product.code}</h1>
              <button 
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                title="Sửa mã hàng"
              >
                <Edit2 size={18} />
              </button>
            </div>
          )}
          <p className="text-gray-500 text-xs sm:text-sm">Ngày cập nhật: {new Date(product.updatedAt).toLocaleString('vi-VN')}</p>
        </div>
        <div className="w-full sm:w-auto flex justify-end">
          <button 
            onClick={handleDelete}
            disabled={deleting}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            <Trash2 size={16} />
            {deleting ? 'Đang xóa...' : 'Xóa mã hàng'}
          </button>
        </div>
      </div>

      <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Chi tiết các bộ phận</h2>
      
      <div className="space-y-6">
        {product.parts.map((part: any) => (
          <div key={part.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-700 text-sm sm:text-base">{part.partName}</h3>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Kích thước (Cạnh 1, 2, 3)</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Loại mút</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Dày x Rộng x Dài</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Số lượng/Bộ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {part.pieces.map((piece: any) => (
                    <tr key={piece.id}>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {piece.edge1} x {piece.edge2} x {piece.edge3}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{piece.material?.name}</td>
                      <td className="px-4 py-3 text-blue-600 font-medium whitespace-nowrap">
                        {piece.thickness ?? Math.min(piece.edge1, piece.edge2, piece.edge3)} x {piece.width} x {piece.height}
                      </td>
                      <td className="px-4 py-3 font-bold whitespace-nowrap">{piece.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
