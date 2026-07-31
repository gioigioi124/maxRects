import React from 'react';
import Link from 'next/link';
import { PackageSearch, ShoppingCart, Scissors, LayoutDashboard } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link href="/" className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="text-blue-500" />
            MaxRects
          </Link>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-2">
          <Link href="/products" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <PackageSearch size={20} />
            Mã hàng
          </Link>
          <Link href="/orders" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <ShoppingCart size={20} />
            Đơn hàng
          </Link>
          <Link href="/packing/suggestions" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <Scissors size={20} />
            Packing & Cắt
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shadow-sm">
          <h2 className="font-semibold text-slate-800">Dashboard Quản lý</h2>
        </header>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
