import * as xlsx from 'xlsx';

export function downloadProductTemplate() {
  const sampleData = [
    {
      'Mã hàng': 'SP-01',
      'Chi tiết': 'Tay trái',
      'Cạnh 1': 50,
      'Cạnh 2': 300,
      'Cạnh 3': 600,
      'Loại mút': 'D40',
      'Số lượng': 1,
    },
    {
      'Mã hàng': 'SP-01',
      'Chi tiết': 'Tựa lưng',
      'Cạnh 1': 100,
      'Cạnh 2': 450,
      'Cạnh 3': 700,
      'Loại mút': 'D25',
      'Số lượng': 1,
    },
    {
      'Mã hàng': 'SP-02',
      'Chi tiết': 'Nệm ngồi',
      'Cạnh 1': 150,
      'Cạnh 2': 500,
      'Cạnh 3': 800,
      'Loại mút': 'D40',
      'Số lượng': 2,
    },
  ];

  const worksheet = xlsx.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 10 },
  ];

  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Mau_Ma_Hang');
  xlsx.writeFile(workbook, 'Mau_Nhap_Ma_Hang.xlsx');
}

export function downloadOrderTemplate() {
  const sampleData = [
    {
      'Mã hàng': 'SP-01',
      'Chi tiết': 'Tay trái',
      'Số lượng': 10,
    },
    {
      'Mã hàng': 'SP-01',
      'Chi tiết': 'Tựa lưng',
      'Số lượng': 10,
    },
    {
      'Mã hàng': 'SP-02',
      'Chi tiết': 'Nệm ngồi',
      'Số lượng': 5,
    },
  ];

  const worksheet = xlsx.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 12 },
  ];

  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Mau_Don_Hang');
  xlsx.writeFile(workbook, 'Mau_Nhap_Don_Hang.xlsx');
}
