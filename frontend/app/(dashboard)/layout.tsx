'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PackageSearch, ShoppingCart, Scissors, LayoutDashboard, Menu, X } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/products', label: 'Mã hàng', icon: PackageSearch },
    { href: '/orders', label: 'Đơn hàng', icon: ShoppingCart },
    { href: '/packing/suggestions', label: 'Packing & Cắt', icon: Scissors },
    { href: '/packing/batches', label: 'Mẻ cắt (Batches)', icon: LayoutDashboard },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 print:bg-white relative">
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out print:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-xl font-bold text-white flex items-center gap-2"
          >
            <LayoutDashboard className="text-blue-500" />
            MaxRects
          </Link>
          <button
            className="md:hidden text-slate-400 hover:text-white p-1"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Đóng menu"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white active:bg-slate-700 transition-colors font-medium text-sm"
              >
                <Icon size={20} className="text-slate-400 group-hover:text-blue-400" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 print:block">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shadow-sm print:hidden sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Mở menu"
            >
              <Menu size={24} />
            </button>
            <h2 className="font-semibold text-slate-800 text-base sm:text-lg truncate">Dashboard Quản lý</h2>
          </div>
          <Link
            href="/"
            className="md:hidden text-sm font-bold text-blue-600 flex items-center gap-1"
          >
            <LayoutDashboard size={18} />
            MaxRects
          </Link>
        </header>
        <div className="flex-1 overflow-auto print:overflow-visible">
          {children}
        </div>
      </main>
    </div>
  );
}

