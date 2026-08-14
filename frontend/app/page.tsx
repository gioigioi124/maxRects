import Link from "next/link";
import {
  ArrowRight,
  PackageSearch,
  ShoppingCart,
  Scissors,
  Printer,
  Sparkles,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  const steps = [
    {
      stepNumber: "01",
      title: "Khai báo Mã hàng",
      subtitle: "Tạo dữ liệu chi tiết & phôi mút",
      description: "Thêm mới hoặc nhập file Excel mã hàng chứa kích thước 3 cạnh (Cạnh 1, 2, 3), loại mút (D40, EP...) và số lượng tấm.",
      icon: PackageSearch,
      color: "blue",
      link: "/products",
      linkText: "Vào Quản lý Mã hàng",
      badge: "Bước 1",
    },
    {
      stepNumber: "02",
      title: "Lên Đơn hàng cần cắt",
      subtitle: "Tạo đơn hàng sản xuất",
      description: "Tạo đơn hàng mới (PO/Invoice), chọn mã hàng & chi tiết cần cắt hoặc tải file Excel danh sách số lượng đơn.",
      icon: ShoppingCart,
      color: "emerald",
      link: "/orders/new",
      linkText: "Tạo Đơn hàng mới",
      badge: "Bước 2",
    },
    {
      stepNumber: "03",
      title: "Xếp hình & Tạo mẻ cắt",
      subtitle: "Chạy thuật toán tối ưu phôi",
      description: "Chọn các đơn hàng cần gộp, chọn khổ phôi (1600x2000, 1800x2000, 1600x2150) và chiến lược cắt (cắt thẳng / khít diện tích).",
      icon: Scissors,
      color: "purple",
      link: "/packing/suggestions",
      linkText: "Đến trang Packing",
      badge: "Bước 3",
    },
    {
      stepNumber: "04",
      title: "In sơ đồ & Xuất xưởng",
      subtitle: "Xem sơ đồ & in trực tiếp",
      description: "Truy cập danh sách Mẻ cắt (Batches), kiểm tra sơ đồ sắp xếp chi tiết trên từng tấm phôi và bấm nút In trực tiếp cho thợ cắt.",
      icon: Printer,
      color: "amber",
      link: "/packing/batches",
      linkText: "Xem Danh sách Mẻ cắt",
      badge: "Bước 4",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-4 shadow-sm">
            <Sparkles size={16} className="text-blue-500 animate-pulse" />
            Hệ Thống Tối Ưu Cắt Mút MaxRects
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
            Hướng Dẫn Quy Trình <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Tạo Mẻ Cắt & In Sơ Đồ
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed px-2">
            Thực hiện theo 4 bước đơn giản bên dưới để tự động hóa việc gộp đơn, xếp phôi mút tiết kiệm nhất và in bản thiết kế cho thợ cắt dưới xưởng.
          </p>
        </div>

        {/* 4 Steps Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const colorClasses = {
              blue: {
                badge: "bg-blue-100 text-blue-700 border-blue-200",
                iconBg: "bg-blue-600 text-white",
                cardHover: "hover:border-blue-400 hover:shadow-blue-100",
                button: "bg-blue-600 hover:bg-blue-700 text-white",
                accent: "text-blue-600",
              },
              emerald: {
                badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
                iconBg: "bg-emerald-600 text-white",
                cardHover: "hover:border-emerald-400 hover:shadow-emerald-100",
                button: "bg-emerald-600 hover:bg-emerald-700 text-white",
                accent: "text-emerald-600",
              },
              purple: {
                badge: "bg-purple-100 text-purple-700 border-purple-200",
                iconBg: "bg-purple-600 text-white",
                cardHover: "hover:border-purple-400 hover:shadow-purple-100",
                button: "bg-purple-600 hover:bg-purple-700 text-white",
                accent: "text-purple-600",
              },
              amber: {
                badge: "bg-amber-100 text-amber-800 border-amber-200",
                iconBg: "bg-amber-600 text-white",
                cardHover: "hover:border-amber-400 hover:shadow-amber-100",
                button: "bg-amber-600 hover:bg-amber-700 text-white",
                accent: "text-amber-600",
              },
            }[s.color as "blue" | "emerald" | "purple" | "amber"];

            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all duration-300 flex flex-col justify-between relative group ${colorClasses.cardHover} hover:shadow-lg`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${colorClasses.badge}`}>
                      {s.badge}
                    </span>
                    <span className="text-2xl font-black text-slate-300 font-mono">
                      {s.stepNumber}
                    </span>
                  </div>

                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform ${colorClasses.iconBg}`}>
                    <Icon size={24} />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {s.title}
                  </h3>
                  <p className={`text-xs font-semibold mb-3 ${colorClasses.accent}`}>
                    {s.subtitle}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6">
                    {s.description}
                  </p>
                </div>

                <Link
                  href={s.link}
                  className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-medium text-xs transition-colors shadow-sm ${colorClasses.button}`}
                >
                  <span>{s.linkText}</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Quick Action Footer Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-slate-800">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-bold flex items-center justify-center sm:justify-start gap-2">
              <CheckCircle2 className="text-emerald-400" size={22} />
              Sẵn sàng chạy mẻ cắt mới?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Chọn các đơn hàng chờ và tiến hành chạy Xếp hình tự động ngay bây giờ.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              href="/packing/suggestions"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-blue-500/20"
            >
              <Scissors size={18} /> Chạy Xếp Hình ngay
            </Link>
            <Link
              href="/packing/batches"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-5 py-3 rounded-xl font-medium text-sm transition-all"
            >
              <Printer size={18} /> In Mẻ cắt sẵn có
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
