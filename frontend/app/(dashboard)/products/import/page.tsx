import ExcelDropzone from '@/components/excel-upload/ExcelDropzone';

export default function ImportPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Quản lý Mã hàng</h1>
      <ExcelDropzone />
    </div>
  );
}
