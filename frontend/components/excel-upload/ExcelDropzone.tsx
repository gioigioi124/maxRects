'use client';
import React, { useState } from 'react';
import * as xlsx from 'xlsx';
import { UploadCloud, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { API_BASE } from '@/lib/api-client';
import { downloadProductTemplate } from '@/lib/excel-template';

export default function ExcelDropzone() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = xlsx.utils.sheet_to_json(ws);
        setPreviewData(data.slice(0, 10)); // preview top 10 rows
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setMessage('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/products/import`, {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        setMessage('Tải lên thành công!');
        setFile(null);
        setPreviewData([]);
      } else {
        setMessage('Lỗi: ' + result.error);
      }
    } catch (err: any) {
      setMessage('Lỗi kết nối máy chủ');
    }
    setIsUploading(false);
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Nhập dữ liệu Mã hàng</h2>
        <button
          onClick={downloadProductTemplate}
          className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 px-3.5 py-2 rounded-lg hover:bg-gray-50 font-medium text-xs sm:text-sm transition-colors shadow-sm w-full sm:w-auto"
        >
          <Download size={16} /> Tải file Excel mẫu
        </button>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-10 text-center hover:bg-gray-50 transition-colors">
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileChange} 
          className="hidden" 
          id="excel-upload"
        />
        <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center">
          <UploadCloud className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500 mb-3" />
          <span className="text-gray-700 font-semibold text-sm sm:text-base">Nhấn hoặc chạm để chọn file Excel</span>
          <span className="text-xs sm:text-sm text-gray-400 mt-1">Hỗ trợ định dạng .xlsx, .xls</span>
        </label>
      </div>

      {file && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-700 text-sm sm:text-base mb-3 truncate">File đã chọn: {file.name}</h3>
          
          {previewData.length > 0 && (
            <div className="overflow-x-auto border rounded-lg max-w-full">
              <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(previewData[0]).map((key) => (
                      <th key={key} className="px-3 sm:px-4 py-2 text-left font-medium text-gray-500 uppercase whitespace-nowrap">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((val: any, vIdx) => (
                        <td key={vIdx} className="px-3 sm:px-4 py-2 whitespace-nowrap text-gray-700">{val?.toString()}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-2 text-xs text-gray-500 text-center bg-gray-50 border-t">Hiển thị 10 dòng xem trước</div>
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button 
              onClick={handleUpload} 
              disabled={isUploading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors w-full sm:w-auto"
            >
              {isUploading ? 'Đang xử lý...' : 'Xác nhận Lưu'}
            </button>
            {message && (
              <span className={`flex items-center gap-2 text-sm font-medium ${message.includes('Lỗi') ? 'text-red-500' : 'text-green-600'}`}>
                {message.includes('Lỗi') ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                {message}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
