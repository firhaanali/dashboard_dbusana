# 🏪 D'Busana Fashion Dashboard - Backend API

Backend API untuk dashboard fashion D'Busana dengan fitur import Excel/CSV dan analytics real-time.

## 🚀 Fitur Utama

- **Import Data Excel/CSV** dengan validasi komprehensif
- **Dashboard Analytics** real-time dengan KPI metrics
- **RESTful API** untuk frontend integration
- **Database PostgreSQL** dengan Prisma ORM
- **Error Handling** dan logging lengkap
- **File Upload** dengan validasi tipe dan ukuran
- **Rate Limiting** untuk API protection

## 📋 Prerequisites

- Node.js 16+ 
- PostgreSQL 12+
- npm atau yarn

## 🛠️ Installation & Setup

### 🚨 Fix NPM Install Error (multer@^1.4.5)

Jika mengalami error `No matching version found for multer@^1.4.5`:

**Quick Fix:**
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Alternative Methods:**
```bash
# Option 1: Use install script
chmod +x install.sh && ./install.sh  # Linux/Mac
install.bat                           # Windows

# Option 2: Manual fix
npm install multer@1.4.4 --save
npm install
```

📖 **[Lihat troubleshooting.md untuk solusi lengkap](./troubleshooting.md)**

### 1. Clone dan Install Dependencies

```bash
cd backend
npm install  # Atau gunakan script di atas jika error
```

### 2. Database Setup

```bash
# Setup PostgreSQL database
createdb dbusana_db

# Update .env file dengan database credentials
DATABASE_URL="postgresql://username:password@localhost:5432/dbusana_db?schema=public"
```

### 3. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/dbusana_db?schema=public"

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Security
JWT_SECRET="your-super-secret-jwt-key-here-min-32-chars"
```

### 4. Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Optional: Seed with sample data
npm run db:seed
```

### 5. Start Development Server

```bash
# Standard development server
npm run dev

# Or if you need to troubleshoot CORS
npm run dev:cors

# Emergency restart if server hangs
npm run emergency-restart
```

Server akan berjalan di `http://localhost:3001`

## 🚨 Quick Backend Startup Guide

If you're just starting the backend for the first time:

```bash
cd backend
npm install
npm run db:generate
npm run db:push
npm run dev
```

The frontend will show "Demo Data" badges when the backend is not running and will automatically switch to live data when the backend becomes available.

## 📚 API Endpoints

### Dashboard Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/metrics` | Comprehensive dashboard metrics |
| GET | `/api/dashboard/charts?period=30d` | Chart data (7d/30d/90d) |
| GET | `/api/dashboard/category-sales` | Sales grouped by category |
| GET | `/api/dashboard/brand-performance` | Performance by brand |
| GET | `/api/dashboard/top-products?limit=10` | Top selling products |
| GET | `/api/dashboard/recent-activities?limit=10` | Recent sales/stock activities |
| GET | `/api/dashboard/kpi-summary` | Simplified KPI metrics |
| GET | `/api/dashboard/overview` | Complete dashboard data |

### Import Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/import/sales` | Import sales data from Excel/CSV |
| POST | `/api/import/products` | Import product data |
| POST | `/api/import/stock` | Import stock movement data |
| GET | `/api/import/status/:batchId` | Get import batch status |
| GET | `/api/import/history` | Import history with pagination |
| GET | `/api/import/templates/:type` | Download template files |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/` | API information |
| GET | `/api/status` | API status and metrics |

## 📊 Data Models

### SalesData
```typescript
{
  order_id: string
  seller_sku: string
  product_name: string
  color: string
  size: string
  quantity: number
  order_amount: number
  created_time: Date
  delivered_time?: Date
  total_revenue?: number
  hpp?: number // Harga Pokok Penjualan
}
```

### ProductData
```typescript
{
  product_code: string
  product_name: string
  category: string
  brand: string
  size: string
  color: string
  price: number
  cost: number
  stock_quantity: number
  min_stock: number
}
```

## 🔧 Import File Format

### Sales Data Template (Excel/CSV)

| Column | Required | Description |
|--------|----------|-------------|
| order_id | ✅ | Unique order identifier |
| seller_sku | ✅ | Product SKU |
| product_name | ✅ | Product name |
| color | ✅ | Product color |
| size | ✅ | Product size |
| quantity | ✅ | Quantity ordered |
| order_amount | ✅ | Order amount (IDR) |
| created_time | ✅ | Order creation date |
| delivered_time | ❌ | Delivery date |
| hpp | ❌ | Cost of goods sold |

### Validation Rules

1. **Duplicate Detection**: Order ID + SKU + Color + Size
2. **Number Validation**: Quantity & Amount ≥ 0
3. **Date Validation**: Valid date formats
4. **Required Fields**: All marked fields must be filled

## 🧪 Development

### Sample Data

```bash
# Generate sample data untuk testing
npm run db:seed
```

### Database Commands

```bash
# Reset database
npm run db:reset

# Generate Prisma client
npm run db:generate

# Apply migrations
npm run db:migrate
```

### Debugging

```bash
# Enable detailed logging
LOG_LEVEL=debug npm run dev
```

## 📈 KPI Calculations

Dashboard menghitung KPI sesuai dengan business requirements:

1. **Jumlah Pesanan** = `COUNT(DISTINCT order_id)`
2. **Produk Terjual** = `SUM(quantity)`
3. **Total Revenue** = `SUM(total_revenue || order_amount)`
4. **Total Profit** = `SUM(total_revenue - hpp)`

## 🛡️ Security

- Rate limiting per IP
- File upload validation
- SQL injection protection via Prisma
- CORS configuration
- Error sanitization

## 📦 File Upload

- **Max Size**: 10MB
- **Formats**: .xlsx, .xls, .csv
- **Validation**: Comprehensive Excel/CSV parsing
- **Error Reporting**: Detailed error messages per row

## 🔍 Error Handling

API menggunakan konsisten error response format:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Human readable error message",
  "statusCode": 400,
  "details": {...}
}
```

## 📊 Performance

- Database indexing pada field yang sering diquery
- Batched import untuk large files
- Dashboard metrics caching
- Connection pooling

## 🚀 Production Deployment

1. Set environment variables
2. Configure PostgreSQL
3. Run migrations
4. Set up file storage
5. Configure reverse proxy (nginx)
6. Enable SSL/TLS

### Environment Variables (Production)

```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
JWT_SECRET="secure-secret-key"
FRONTEND_URL="https://yourdomain.com"
```

## 🤝 Integration dengan Frontend

Backend ini dirancang untuk terintegrasi dengan React frontend yang menggunakan:

- `ImportDataContext` untuk state management
- `useApi` hooks untuk API calls
- `excelParser` service untuk file handling

Response format disesuaikan dengan interface TypeScript frontend.

## 📋 Testing

```bash
# Test import functionality
curl -X POST http://localhost:3001/api/import/sales \
  -F "file=@sample_sales.xlsx"

# Test dashboard metrics
curl http://localhost:3001/api/dashboard/metrics
```

## 📞 Support

Untuk pertanyaan atau issue, silakan buat issue di repository atau hubungi development team.

---

**D'Busana Dashboard Backend API v1.0.0**
Built with ❤️ for fashion business analytics