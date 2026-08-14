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

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (!product || product.error) return <div className="p-6 text-red-500">Không tìm thấy mã hàng!</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/products" className="flex items-center text-blue-600 hover:underline">
          <ArrowLeft size={16} className="mr-1" /> Quay lại danh sách
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6 flex justify-between items-start">
        <div>
          {isEditing ? (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-800">Mã hàng:</span>
              <input 
                type="text" 
                value={editCode}
                onChange={e => setEditCode(e.target.value)}
                className="border rounded px-2 py-1 text-lg font-bold"
                autoFocus
              />
              <button 
                onClick={handleSave}
                disabled={saving}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                title="Lưu"
              >
                <Check size={20} />
              </button>
              <button 
                onClick={() => { setIsEditing(false); setEditCode(product.code); }}
                disabled={saving}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                title="Hủy"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-800">Mã hàng: {product.code}</h1>
              <button 
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title="Sửa mã hàng"
              >
                <Edit2 size={18} />
              </button>
            </div>
          )}
          <p className="text-gray-500 text-sm mb-4">Ngày cập nhật: {new Date(product.updatedAt).toLocaleString('vi-VN')}</p>
        </div>
        <div>
          <button 
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            <Trash2 size={16} />
            {deleting ? 'Đang xóa...' : 'Xóa mã hàng'}
          </button>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4 text-gray-800">Chi tiết các bộ phận</h2>
      
      <div className="space-y-6">
        {product.parts.map((part: any) => (
          <div key={part.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-700">{part.partName}</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Kích thước (Cạnh 1, 2, 3)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Loại mút</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Dày x Rộng x Dài</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Số lượng/Bộ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {part.pieces.map((piece: any) => (
                  <tr key={piece.id}>
                    <td className="px-4 py-2 text-gray-700">
                      {piece.edge1} x {piece.edge2} x {piece.edge3}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{piece.material?.name}</td>
                    <td className="px-4 py-2 text-blue-600 font-medium">
                      {piece.thickness ?? Math.min(piece.edge1, piece.edge2, piece.edge3)} x {piece.width} x {piece.height}
                    </td>
                    <td className="px-4 py-2 font-bold">{piece.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
