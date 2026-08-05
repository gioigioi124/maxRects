'use client';
import React, { use } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LayoutViewer = dynamic(() => import('@/components/layout-canvas/LayoutViewer'), { ssr: false });

export default function PackingBatchPage({ params }: { params: Promise<{ batchId: string }> }) {
  const resolvedParams = use(params);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/packing/batches">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft size={16} /> Quay lại danh sách
          </Button>
        </Link>
      </div>
      <LayoutViewer batchId={resolvedParams.batchId} />
    </div>
  );
}
