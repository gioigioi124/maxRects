import Link from "next/link";
import {
  ArrowRight,
  PackageSearch,
  ShoppingCart,
  Scissors,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="text-center max-w-3xl w-full">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 sm:mb-6 leading-tight">
          Hệ thống Tối ưu <span className="text-blue-600">MaxRects</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 mb-8 sm:mb-10 px-2">
          Giải pháp toàn diện quản lý mã hàng, lên đơn và tự động hóa quá trình
          xếp hình (packing) cho xưởng cắt mút. Giảm thiểu hao hụt, tăng cường
          hiệu suất.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Link
            href="/products"
            className="group bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center text-center"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PackageSearch size={28} className="sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
              1. Quản lý Mã hàng
            </h3>
            <p className="text-sm text-slate-500">
              Khai báo cấu trúc, kích thước chi tiết và tự động tính toán từ
              file Excel.
            </p>
          </Link>

          <Link
            href="/orders"
            className="group bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all flex flex-col items-center text-center"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShoppingCart size={28} className="sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
              2. Lên Đơn hàng
            </h3>
            <p className="text-sm text-slate-500">
              Tạo đơn hàng từ các mã sản phẩm đã lưu, chỉ định số lượng sản
              xuất.
            </p>
          </Link>

          <Link
            href="/packing/suggestions"
            className="group bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-300 transition-all flex flex-col items-center text-center"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Scissors size={28} className="sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
              3. Packing & Cắt
            </h3>
            <p className="text-sm text-slate-500">
              Gộp đơn hàng, sử dụng hệ thống tự động tối ưu diện tích mút cắt.
            </p>
          </Link>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto text-base sm:text-lg"
        >
          Bắt đầu sử dụng <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
}
