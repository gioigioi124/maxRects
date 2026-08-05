'use client';
import React, { useEffect, useState, use } from 'react';
import OrderPrintView from '@/components/print/OrderPrintView';
import PartPrintView from '@/components/print/PartPrintView';

export default function PrintPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const resolvedParams = use(params);
  const { type, id } = resolvedParams;
  
  const [order, setOrder] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (type === 'order') {
      fetch(`http://localhost:3001/orders/${id}`)
        .then(res => res.json())
        .then(data => {
          setOrder(data);
          setLoading(false);
          setTimeout(() => window.print(), 500);
        })
        .catch(err => { console.error(err); setLoading(false); });
    } else if (type === 'product') {
      fetch(`http://localhost:3001/products/${id}`)
        .then(res => res.json())
        .then(data => {
          setProduct(data);
          setLoading(false);
          setTimeout(() => window.print(), 500);
        })
        .catch(err => { console.error(err); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [type, id]);

  if (loading) return <div className="p-6 text-center">Đang tải dữ liệu in...</div>;

  if (type === 'order' && order) {
    return <OrderPrintView order={order} />;
  }

  if (type === 'product' && product) {
    return (
      <div>
        {product.parts?.map((part: any) => (
          <PartPrintView
            key={part.id}
            part={part}
            orderCode={product.code}
          />
        ))}
      </div>
    );
  }

  return <div className="p-6 text-center text-red-500">Không hỗ trợ kiểu in: {type}</div>;
}