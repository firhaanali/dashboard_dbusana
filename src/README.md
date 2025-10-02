# D'Busana Fashion Dashboard

Sistem manajemen comprehensive untuk bisnis fashion dengan kemampuan import data Excel/CSV, analytics real-time, dan monitoring KPI performa bisnis.

![Dashboard Overview](https://img.shields.io/badge/Status-Production%20Ready-green)
![Tech Stack](https://img.shields.io/badge/Tech-React%20%7C%20TypeScript%20%7C%20Node.js-blue)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)

## 🚀 Quick Start

### 🔥 Recommended: Auto Startup (Sangat Mudah!)
```bash
# Clone repository
git clone <repository-url>
cd dbusana-dashboard

# Start both frontend + backend automatically
npm run start-all
```
**Script akan otomatis:**
- ✅ Install dependencies (frontend & backend)
- ✅ Setup database connection  
- ✅ Start backend server (http://localhost:3001)
- ✅ Start frontend server (http://localhost:3000)
- ✅ Show health checks & troubleshooting

### 🐛 Debug Mode (Jika Ada Masalah)
```bash
# Diagnose connection issues
npm run debug
```
**Debug script akan check:**
- ✅ File structure dan dependencies
- ✅ Backend server status (port 3001)
- ✅ Frontend server status (port 3000) 
- ✅ API endpoints response
- ✅ Database connection
- ✅ Troubleshooting recommendations

### Opsi 1: Frontend Only (Cepat untuk Demo)
```bash
# Clone dan install dependencies
git clone <repository-url>
cd dbusana-dashboard
npm install

# Start frontend development server
npm run dev
```
**Dashboard akan berjalan di http://localhost:3000** dengan mode frontend-only (menggunakan data import lokal).

### Opsi 2: Manual Full Stack Setup
```bash
# 1. Setup Backend (terminal pertama)
cd backend
npm install
npm run dev  # Backend: http://localhost:3001

# 2. Setup Frontend (terminal kedua)
npm install  
npm run dev  # Frontend: http://localhost:3000

# ✅ Proxy otomatis terkonfigurasi!
# API calls: /api/* → http://localhost:3001/api/*
# Health check: /health → http://localhost:3001/health
```

> **💡 Proxy Configuration**: Vite automatically routes `/api` and `/health` requests to backend server. No CORS issues! 

### Database Setup (Optional)
```bash
# 3. Setup Database PostgreSQL (if using full backend features)
createdb dbusana_db

# 4. Configure environment
cp backend/.env.example backend/.env
# Edit DATABASE_URL di backend/.env

# 5. Setup database schema
cd backend
npm run db:generate
npm run db:push
```

## 📊 Fitur Utama

### ✅ Dashboard Analytics
- **KPI Cards**: Jumlah pesanan, produk terjual, revenue, profit
- **Time-series Charts**: Tren penjualan dengan filter periode
- **Category Analysis**: Performance breakdown per kategori
- **Brand Performance**: Analytics per brand fashion
- **Top Products**: Ranking produk terlaris

### ✅ Import Data System
- **Excel/CSV Import**: Drag & drop upload dengan validasi real-time
- **Multi-format Support**: .xlsx, .xls, .csv
- **Data Validation**: 5-layer validation system
- **Error Reporting**: Detail error dengan nomor baris
- **Template Download**: Template standard untuk import

### ✅ Business Intelligence
- **Real-time KPI**: Calculation otomatis dari data import
- **Profit Analysis**: Margin analysis dengan HPP tracking
- **Sales Forecasting**: Trend analysis dan prediksi
- **Inventory Management**: Stock tracking dan low-stock alerts

## 🧮 KPI Formula (Business Logic)

Dashboard menggunakan formula bisnis yang telah divalidasi:

```typescript
// 1. Jumlah Pesanan = Distinct Order ID
distinctOrders = new Set(salesData.map(sale => sale.order_id)).size

// 2. Produk Terjual = Sum Quantity 
totalQuantitySold = salesData.reduce((sum, sale) => sum + sale.quantity, 0)

// 3. Total Revenue = Sum Total Revenue
totalRevenue = salesData.reduce((sum, sale) => 
  sum + (sale.total_revenue || sale.order_amount), 0)

// 4. Total Profit = Revenue - HPP
totalProfit = totalRevenue - totalHPP
profitMargin = (totalProfit / totalRevenue) * 100
```

## 📁 Struktur Project

```
dbusana-dashboard/
├── components/
│   ├── ui/                    # ShadCN UI components
│   ├── KPICards.tsx          # Dashboard KPI metrics
│   ├── AnalyticsDashboard.tsx # Charts & analytics
│   ├── ImportPageClean.tsx   # Import data interface
│   ├── SalesManagement.tsx   # Sales table & management
│   └── ProductsManagement.tsx # Product catalog
├── contexts/
│   └── ImportDataContext.tsx # Global state management
├── services/
│   ├── api.ts               # Backend API integration
│   └── excelParser.ts       # Excel/CSV parsing engine
├── hooks/
│   └── useApi.ts            # Custom API hooks
└── backend/
    ├── src/
    │   ├── controllers/     # API controllers
    │   ├── routes/         # Express routes
    │   └── middleware/     # Auth & validation
    └── prisma/
        └── schema.prisma   # Database schema
```

## 📋 Format Data Import

### Sales Data Template
Download template dari dashboard atau gunakan format ini:

| Column | Required | Type | Description | Example |
|--------|----------|------|-------------|---------|
| Order ID | ✅ | String | Unique order identifier | ORD-2024-001 |
| Seller SKU | ✅ | String | Product SKU code | DRS-001-RED-M |
| Product Name | ✅ | String | Product name | Dress Casual Wanita |
| Color | ✅ | String | Product color | Red |
| Size | ✅ | String | Product size | M |
| Quantity | ✅ | Number | Quantity sold | 1 |
| Order Amount | ✅ | Number | Order amount (IDR) | 450000 |
| Created Time | ✅ | Date | Order date | 2024-08-30 |
| Delivered Time | ❌ | Date | Delivery date (optional) | 2024-09-02 |
| Total revenue | ❌ | Number | Total revenue | 450000 |
| HPP | ❌ | Number | Cost price | 200000 |

### Sample CSV Data
```csv
Order ID,Seller SKU,Product Name,Color,Size,Quantity,Order Amount,Created Time,Total revenue,HPP
ORD-2024-001,DRS-001-RED-M,Dress Casual Wanita,Red,M,1,450000,2024-08-30,450000,200000
ORD-2024-001,BLZ-002-BLU-L,Blazer Formal Wanita,Blue,L,1,750000,2024-08-30,750000,350000
ORD-2024-002,TPS-003-WHT-S,Top Kasual Wanita,White,S,2,320000,2024-08-31,640000,280000
```

## 🔧 Environment Configuration

### Frontend (.env)
```env
# API Configuration - Proxy Mode (Default)
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=
VITE_API_TIMEOUT=30000

# Alternative: Direct Mode (uncomment if needed)
# VITE_API_BASE_URL=http://localhost:3001/api
# VITE_BACKEND_URL=http://localhost:3001

# File Upload Configuration
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=.xlsx,.xls,.csv
VITE_IMPORT_MAX_ROWS=10000

# Development Configuration
VITE_APP_ENV=development
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=true

# UI Configuration
VITE_DEFAULT_THEME=light
VITE_ENABLE_DARK_MODE=true
```

> **🔗 Proxy vs Direct URLs**: Default menggunakan proxy (`/api`) untuk development experience yang lebih baik. Dapat beralih ke direct URLs jika diperlukan.

### Backend (backend/.env)
```env
# Database Configuration
DATABASE_URL="postgresql://firhan:1234@localhost:5432/dbusana_db?schema=public"

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Security
JWT_SECRET="your-super-secret-jwt-key-here-change-in-production-min-32-chars"
API_KEY="dbusana-api-key-2024"

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=.xlsx,.xls,.csv

# Excel/CSV Processing
MAX_ROWS_PER_IMPORT=10000
BATCH_SIZE=1000
```

## 🛡️ Data Validation System

Dashboard menggunakan 5-layer validation system:

### 1. File Validation
- Size limits (max 10MB)
- Format checking (.xlsx, .xls, .csv)
- Encoding validation (UTF-8)

### 2. Column Mapping
- Automatic column detection
- Flexible header matching
- Required field validation

### 3. Field Validation
- Data type checking
- Range validation (quantities, amounts)
- Format normalization (dates, numbers)

### 4. Cross-field Validation
- Date consistency (delivery after creation)
- Amount validation (settlement ≤ order amount)
- Business logic validation

### 5. Duplicate Detection
- Composite key checking (Order ID + SKU + Color + Size)
- Warning untuk potential duplicates
- Data integrity preservation

## 🔌 API Endpoints

### Dashboard
- `GET /api/dashboard/metrics` - KPI summary
- `GET /api/dashboard/charts?period=30d` - Chart data
- `GET /api/dashboard/category-sales` - Category breakdown
- `GET /api/dashboard/brand-performance` - Brand analytics

### Import System
- `POST /api/import/sales` - Upload sales data
- `GET /api/import/templates/sales` - Download template
- `GET /api/import/history` - Import history
- `GET /api/import/status/:batchId` - Import status

### Management
- `GET /api/sales` - Sales data with pagination
- `GET /api/products` - Product catalog
- `GET /api/customers` - Customer data

## 🔍 Troubleshooting

### Connection Issues
1. **Backend not available**: Pastikan backend running di port 3001
2. **Proxy not working**: Check vite.config.js proxy configuration
3. **Database connection failed**: Check PostgreSQL dan DATABASE_URL
4. **Import data tidak muncul**: Refresh halaman atau check import status

### Proxy vs Direct Mode Issues
```bash
# Issue: API calls failing with proxy
# Solution: Check if backend is running
cd backend && npm run dev

# Issue: CORS errors (direct mode)
# Solution: Switch to proxy mode in .env
VITE_API_BASE_URL=/api
VITE_BACKEND_URL=

# Issue: 404 on /api requests
# Solution: Verify vite.config.js proxy configuration
```

### Common Errors
```bash
# Error: Port 3001 already in use
lsof -ti:3001 | xargs kill -9

# Error: Database does not exist
createdb dbusana_db

# Error: Prisma schema mismatch
cd backend && npm run db:push

# Error: Proxy connection refused
# Check backend server status
curl http://localhost:3001/health
```

### Debug Mode
Enable logging untuk troubleshooting:
```env
VITE_ENABLE_DEBUG=true
```

Akan menampilkan:
- API connection status
- Import validation process
- KPI calculation details
- Chart data generation logs

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
npm run preview
```

### Backend (Railway/DigitalOcean)
```bash
cd backend
npm run build
npm start
```

### Database (Railway/Supabase)
```bash
npm run db:push
npm run db:seed
```

## 📈 Performance

- **Frontend**: React with TypeScript, optimized builds
- **Backend**: Node.js with Express, connection pooling
- **Database**: PostgreSQL dengan indexed queries
- **File Processing**: Streaming untuk large files
- **Caching**: Redis untuk frequent queries (optional)

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Follow TypeScript strict mode
4. Use ShadCN components untuk consistency
5. Add proper validation dan error handling
6. Update documentation
7. Submit pull request

## 📞 Support

Untuk support dan pertanyaan:
- **Email**: admin@dbusana.com
- **Documentation**: README.md (file ini)
- **Issues**: GitHub Issues

## 📄 License

Private project untuk D'Busana Fashion Business.
© 2024 D'Busana. All rights reserved.