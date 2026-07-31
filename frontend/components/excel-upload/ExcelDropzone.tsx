'use client';
import React, { useState } from 'react';
import * as xlsx from 'xlsx';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';

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
      const res = await fetch('http://localhost:3001/products/import', {
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
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Nhập dữ liệu Mã hàng</h2>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:bg-gray-50 transition-colors">
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileChange} 
          className="hidden" 
          id="excel-upload"
        />
        <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center">
          <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
          <span className="text-gray-600 font-medium">Nhấn để chọn file Excel</span>
          <span className="text-sm text-gray-400 mt-1">Hỗ trợ định dạng .xlsx, .xls</span>
        </label>
      </div>

      {file && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-700 mb-2">File đã chọn: {file.name}</h3>
          
          {previewData.length > 0 && (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(previewData[0]).map((key) => (
                      <th key={key} className="px-4 py-2 text-left font-medium text-gray-500 uppercase">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((val: any, vIdx) => (
                        <td key={vIdx} className="px-4 py-2 whitespace-nowrap text-gray-700">{val?.toString()}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-2 text-xs text-gray-500 text-center bg-gray-50 border-t">Hiển thị 10 dòng xem trước</div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-4">
            <button 
              onClick={handleUpload} 
              disabled={isUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isUploading ? 'Đang xử lý...' : 'Xác nhận Lưu'}
            </button>
            {message && (
              <span className={`flex items-center gap-2 ${message.includes('Lỗi') ? 'text-red-500' : 'text-green-500'}`}>
                {message.includes('Lỗi') ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                {message}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
