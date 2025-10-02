const { PrismaClient } = require('@prisma/client');
const moment = require('moment');

const prisma = new PrismaClient();

// Sample data for development testing
const generateSampleSalesData = () => {
  const products = [
    { name: 'Blouse Casual', sku: 'BLS', colors: ['Red', 'Blue', 'White'], sizes: ['S', 'M', 'L'] },
    { name: 'Dress Formal', sku: 'DRS', colors: ['Black', 'Navy', 'Gray'], sizes: ['S', 'M', 'L', 'XL'] },
    { name: 'Tunik Modern', sku: 'TUN', colors: ['Pink', 'Green', 'Purple'], sizes: ['M', 'L', 'XL'] },
    { name: 'Kemeja Kerja', sku: 'KMJ', colors: ['White', 'Blue', 'Gray'], sizes: ['S', 'M', 'L'] },
    { name: 'Outer Cardigan', sku: 'OUT', colors: ['Beige', 'Brown', 'Black'], sizes: ['M', 'L'] }
  ];
  
  const salesData = [];
  
  // Generate data for last 90 days
  for (let i = 0; i < 90; i++) {
    const date = moment().subtract(i, 'days');
    const dailySales = Math.floor(Math.random() * 15) + 5; // 5-20 sales per day
    
    for (let j = 0; j < dailySales; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const color = product.colors[Math.floor(Math.random() * product.colors.length)];
      const size = product.sizes[Math.floor(Math.random() * product.sizes.length)];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
      const basePrice = Math.floor(Math.random() * 200000) + 50000; // 50k-250k
      const orderAmount = basePrice * quantity;
      const hpp = basePrice * 0.6; // 60% of selling price
      const totalRevenue = orderAmount;
      
      // Random delivery time (some orders might not be delivered yet)
      const deliveredTime = Math.random() > 0.3 ? 
        date.clone().add(Math.floor(Math.random() * 5) + 1, 'days').toDate() : 
        null;
      
      salesData.push({
        order_id: `ORD-${date.format('YYYYMMDD')}-${String(j + 1).padStart(3, '0')}`,
        seller_sku: `${product.sku}-${color.substring(0, 3).toUpperCase()}-${size}`,
        product_name: product.name,
        color: color,
        size: size,
        quantity: quantity,
        order_amount: orderAmount,
        created_time: date.toDate(),
        delivered_time: deliveredTime,
        settlement_amount: deliveredTime ? orderAmount * 0.95 : null, // 5% platform fee
        total_revenue: totalRevenue,
        hpp: hpp * quantity,
        total: totalRevenue
      });
    }
  }
  
  return salesData;
};

const generateSampleProductData = () => {
  const categories = ['Blouse', 'Dress', 'Tunik', 'Kemeja', 'Outer'];
  const brands = ['D\'Busana', 'Elegant', 'Casual', 'Formal', 'Modern'];
  const colors = ['Red', 'Blue', 'White', 'Black', 'Navy', 'Gray', 'Pink', 'Green', 'Purple', 'Beige', 'Brown'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  
  const productData = [];
  let productCounter = 1;
  
  categories.forEach(category => {
    brands.forEach(brand => {
      colors.forEach(color => {
        sizes.forEach(size => {
          const basePrice = Math.floor(Math.random() * 200000) + 50000; // 50k-250k
          const cost = basePrice * 0.6; // 60% of selling price
          const stockQuantity = Math.floor(Math.random() * 100) + 10; // 10-110 items
          const minStock = Math.floor(stockQuantity * 0.2); // 20% of current stock
          
          productData.push({
            product_code: `PRD-${String(productCounter).padStart(6, '0')}`,
            product_name: `${category} ${brand} ${color} ${size}`,
            category: category,
            brand: brand,
            size: size,
            color: color,
            price: basePrice,
            cost: cost,
            stock_quantity: stockQuantity,
            min_stock: minStock,
            description: `${category} berkualitas tinggi dari brand ${brand} dengan warna ${color} ukuran ${size}`
          });
          
          productCounter++;
        });
      });
    });
  });
  
  return productData.slice(0, 500); // Limit to 500 products for testing
};

const generateSampleStockData = (productCodes) => {
  const movementTypes = ['in', 'out', 'adjustment'];
  const stockData = [];
  
  // Generate stock movements for last 30 days
  for (let i = 0; i < 30; i++) {
    const date = moment().subtract(i, 'days');
    const dailyMovements = Math.floor(Math.random() * 10) + 2; // 2-12 movements per day
    
    for (let j = 0; j < dailyMovements; j++) {
      const productCode = productCodes[Math.floor(Math.random() * productCodes.length)];
      const movementType = movementTypes[Math.floor(Math.random() * movementTypes.length)];
      const quantity = Math.floor(Math.random() * 20) + 1; // 1-20 items
      
      stockData.push({
        product_code: productCode,
        movement_type: movementType,
        quantity: movementType === 'out' ? -quantity : quantity,
        reference_number: `REF-${date.format('YYYYMMDD')}-${String(j + 1).padStart(3, '0')}`,
        notes: `${movementType === 'in' ? 'Stock masuk' : movementType === 'out' ? 'Stock keluar' : 'Penyesuaian stock'} otomatis`,
        movement_date: date.toDate()
      });
    }
  }
  
  return stockData;
};

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.stockData.deleteMany({});
    await prisma.salesData.deleteMany({});
    await prisma.productData.deleteMany({});
    await prisma.importBatch.deleteMany({});
    await prisma.dashboardMetrics.deleteMany({});
    
    // Generate sample data
    console.log('📊 Generating sample data...');
    const salesData = generateSampleSalesData();
    const productData = generateSampleProductData();
    const stockData = generateSampleStockData(productData.map(p => p.product_code));
    
    // Create import batches
    console.log('📦 Creating import batches...');
    const salesBatch = await prisma.importBatch.create({
      data: {
        batch_name: 'Development Seed - Sales Data',
        import_type: 'sales',
        file_name: 'seed_sales_data.csv',
        file_type: 'csv',
        total_records: salesData.length,
        valid_records: salesData.length,
        invalid_records: 0,
        imported_records: salesData.length,
        status: 'completed'
      }
    });
    
    const productBatch = await prisma.importBatch.create({
      data: {
        batch_name: 'Development Seed - Product Data',
        import_type: 'products',
        file_name: 'seed_product_data.csv',
        file_type: 'csv',
        total_records: productData.length,
        valid_records: productData.length,
        invalid_records: 0,
        imported_records: productData.length,
        status: 'completed'
      }
    });
    
    const stockBatch = await prisma.importBatch.create({
      data: {
        batch_name: 'Development Seed - Stock Data',
        import_type: 'stock',
        file_name: 'seed_stock_data.csv',
        file_type: 'csv',
        total_records: stockData.length,
        valid_records: stockData.length,
        invalid_records: 0,
        imported_records: stockData.length,
        status: 'completed'
      }
    });
    
    // Insert data
    console.log('💾 Inserting sales data...');
    for (const sale of salesData) {
      await prisma.salesData.create({
        data: {
          ...sale,
          import_batch_id: salesBatch.id
        }
      });
    }
    
    console.log('💾 Inserting product data...');
    for (const product of productData) {
      await prisma.productData.create({
        data: {
          ...product,
          import_batch_id: productBatch.id
        }
      });
    }
    
    console.log('💾 Inserting stock data...');
    for (const stock of stockData) {
      await prisma.stockData.create({
        data: {
          ...stock,
          import_batch_id: stockBatch.id
        }
      });
    }
    
    // Calculate and cache dashboard metrics
    console.log('📊 Calculating dashboard metrics...');
    const distinctOrders = new Set(salesData.map(sale => sale.order_id)).size;
    const totalQuantitySold = salesData.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total_revenue, 0);
    const totalHPP = salesData.reduce((sum, sale) => sum + sale.hpp, 0);
    const totalProfit = totalRevenue - totalHPP;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = distinctOrders > 0 ? totalRevenue / distinctOrders : 0;
    
    await prisma.dashboardMetrics.create({
      data: {
        metric_date: new Date(),
        distinct_orders: distinctOrders,
        total_quantity_sold: totalQuantitySold,
        total_revenue: totalRevenue,
        total_profit: totalProfit,
        total_hpp: totalHPP,
        profit_margin: profitMargin,
        average_order_value: averageOrderValue,
        total_sales_records: salesData.length,
        today_revenue: salesData.filter(s => moment(s.created_time).isSame(moment(), 'day'))
          .reduce((sum, sale) => sum + sale.total_revenue, 0),
        today_orders: new Set(salesData.filter(s => moment(s.created_time).isSame(moment(), 'day'))
          .map(sale => sale.order_id)).size,
        month_revenue: salesData.filter(s => moment(s.created_time).isSame(moment(), 'month'))
          .reduce((sum, sale) => sum + sale.total_revenue, 0),
        month_orders: new Set(salesData.filter(s => moment(s.created_time).isSame(moment(), 'month'))
          .map(sale => sale.order_id)).size,
        total_products: productData.length,
        low_stock_products: productData.filter(p => p.stock_quantity <= p.min_stock).length,
        out_of_stock_products: productData.filter(p => p.stock_quantity === 0).length,
        total_categories: new Set(productData.map(p => p.category)).size,
        total_brands: new Set(productData.map(p => p.brand)).size
      }
    });
    
    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   - ${salesData.length} sales records`);
    console.log(`   - ${productData.length} product records`);
    console.log(`   - ${stockData.length} stock movement records`);
    console.log(`   - ${distinctOrders} distinct orders`);
    console.log(`   - Total revenue: Rp ${totalRevenue.toLocaleString('id-ID')}`);
    console.log(`   - Total profit: Rp ${totalProfit.toLocaleString('id-ID')}`);
    console.log(`   - Profit margin: ${profitMargin.toFixed(2)}%`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('🎉 Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = seed;