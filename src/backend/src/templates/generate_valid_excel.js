const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Create proper Excel file
const headers = [
    'Order ID', 'Seller SKU', 'Product Name', 'Color', 'Size',
    'Quantity', 'Order Amount', 'Created Time', 'Delivered Time',
    'Total settlement amount', 'Total revenue', 'HPP', 'Total',
    'Marketplace', 'Customer', 'Province', 'Regency', 'City'
];

const sampleData = [
    ['DBU-001', 'DBS-001-RED-M', 'Kemeja Batik Modern', 'Red', 'M', 2, 350000, '15-01-2024', '17-01-2024', 332500, 350000, 200000, 350000, 'TikTok Shop', 'Ibu Sari Dewi', 'DKI Jakarta', 'Jakarta Pusat', 'Jakarta Pusat'],
    ['DBU-002', 'DBS-002-BLUE-L', 'Blouse Wanita Elegant', 'Blue', 'L', 1, 200000, '16-01-2024', '18-01-2024', 190000, 200000, 130000, 200000, 'Shopee', 'Bpk. Ahmad Pratama', 'Jawa Barat', 'Bandung', 'Bandung'],
    ['DBU-003', 'DBS-003-GREEN-S', 'Celana Panjang Formal', 'Green', 'S', 3, 540000, '17-01-2024', '', 513000, 540000, 360000, 540000, 'Tokopedia', 'Ibu Maya Indira', 'Jawa Tengah', 'Semarang', 'Semarang']
];

try {
    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheetData = [headers, ...sampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    worksheet['!cols'] = [
        { wch: 15 }, { wch: 18 }, { wch: 25 }, { wch: 12 }, { wch: 8 },
        { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
        { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 },
        { wch: 18 }, { wch: 18 }, { wch: 18 }
    ];

    // Add worksheet
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');

    // Write Excel file
    const excelPath = path.join(__dirname, 'sales_template.xlsx');
    XLSX.writeFile(workbook, excelPath, { 
        bookType: 'xlsx', 
        compression: true 
    });

    console.log('✅ Excel template berhasil dibuat:', excelPath);
    
    // Verify file
    const testBook = XLSX.readFile(excelPath);
    console.log('✅ File valid dan dapat dibaca');
    
} catch (error) {
    console.error('❌ Error:', error.message);
}