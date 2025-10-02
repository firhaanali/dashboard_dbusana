const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all stock data (main endpoint for dashboard) - Updated for Stock Forecasting Dashboard
const getStock = async (req, res) => {
  try {
    const { limit = 1000, offset = 0 } = req.query;

    // Get all product data with stock information for forecasting dashboard
    const productData = await prisma.productData.findMany({
      select: {
        id: true,
        product_code: true,
        product_name: true,
        category: true,
        brand: true,
        size: true,
        color: true,
        stock_quantity: true,
        min_stock: true,
        price: true,
        cost: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        product_name: 'asc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Transform data to match Stock Forecasting Dashboard expectations
    const transformedData = productData.map(product => ({
      id: product.id,
      sku_code: product.product_code,
      product_name: product.product_name,
      color: product.color,
      size: product.size,
      current_stock: product.stock_quantity,
      minimum_stock: product.min_stock,
      maximum_stock: product.min_stock * 3, // Estimate max stock as 3x min stock
      location: 'Warehouse', // Default location
      last_updated: product.updated_at.toISOString(),
      unit_cost: product.cost,
      selling_price: product.price
    }));

    const totalCount = await prisma.productData.count();

    console.log(`📦 Retrieved ${transformedData.length} product stock records for forecasting dashboard`);

    res.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
      total: totalCount
    });
  } catch (error) {
    console.error('❌ Error fetching stock data for forecasting:', error);
    res.status(500).json({
      success: false,
      data: [],
      error: 'Failed to fetch stock data',
      details: error.message
    });
  }
};

// Get all stock movements
const getStockMovements = async (req, res) => {
  try {
    const { limit = 50, offset = 0, productCode } = req.query;

    let whereClause = {};
    if (productCode) {
      whereClause.product_code = productCode;
    }

    const stockMovements = await prisma.stockData.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            product_name: true,
            category: true,
            brand: true
          }
        }
      },
      orderBy: {
        movement_date: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const totalCount = await prisma.stockData.count({
      where: whereClause
    });

    console.log(`📊 Retrieved ${stockMovements.length} stock movements from database`);

    res.json({
      success: true,
      data: stockMovements,
      count: stockMovements.length,
      total: totalCount
    });
  } catch (error) {
    console.error('❌ Error fetching stock movements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock movements',
      details: error.message
    });
  }
};

// Get stock movement history for specific product
const getStockHistory = async (req, res) => {
  try {
    const { productCode } = req.params;
    const { limit = 20 } = req.query;

    const stockHistory = await prisma.stockData.findMany({
      where: {
        product_code: productCode
      },
      include: {
        product: {
          select: {
            product_name: true,
            category: true,
            brand: true,
            stock_quantity: true
          }
        }
      },
      orderBy: {
        movement_date: 'desc'
      },
      take: parseInt(limit)
    });

    console.log(`📈 Retrieved ${stockHistory.length} stock history for product ${productCode}`);

    res.json({
      success: true,
      data: stockHistory,
      count: stockHistory.length
    });
  } catch (error) {
    console.error('❌ Error fetching stock history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock history',
      details: error.message
    });
  }
};

// Create stock movement and automatically update product stock
const createStockMovement = async (req, res) => {
  try {
    const {
      product_code,
      movement_type,
      quantity,
      reference_number,
      notes,
      movement_date
    } = req.body;

    // Validate required fields
    if (!product_code || !movement_type || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: product_code, movement_type, quantity'
      });
    }

    // Validate movement type
    if (!['in', 'out', 'adjustment'].includes(movement_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid movement_type. Must be: in, out, or adjustment'
      });
    }

    // Find the product
    const product = await prisma.productData.findUnique({
      where: { product_code }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: `Product with code ${product_code} not found`
      });
    }

    // Calculate new stock quantity based on movement type
    let newStockQuantity = product.stock_quantity;
    const quantityValue = parseInt(quantity);

    switch (movement_type) {
      case 'in':
        newStockQuantity += quantityValue;
        break;
      case 'out':
        newStockQuantity -= quantityValue;
        break;
      case 'adjustment':
        newStockQuantity = quantityValue;
        break;
    }

    // Ensure stock doesn't go negative
    if (newStockQuantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Stock quantity cannot be negative'
      });
    }

    // Use transaction to ensure both stock movement and product update happen together
    const result = await prisma.$transaction(async (prisma) => {
      // Create stock movement record
      const stockMovement = await prisma.stockData.create({
        data: {
          product_code,
          movement_type,
          quantity: quantityValue,
          reference_number: reference_number || null,
          notes: notes || null,
          movement_date: movement_date ? new Date(movement_date) : new Date()
        },
        include: {
          product: {
            select: {
              product_name: true,
              category: true,
              brand: true
            }
          }
        }
      });

      // Update product stock quantity
      const updatedProduct = await prisma.productData.update({
        where: { product_code },
        data: { stock_quantity: newStockQuantity }
      });

      return { stockMovement, updatedProduct };
    });

    console.log(`✅ Created stock movement and updated stock for ${product.product_name}: ${product.stock_quantity} → ${newStockQuantity}`);

    res.status(201).json({
      success: true,
      data: {
        stockMovement: result.stockMovement,
        updatedProduct: result.updatedProduct,
        previousStock: product.stock_quantity,
        newStock: newStockQuantity
      },
      message: 'Stock movement created and product stock updated successfully'
    });
  } catch (error) {
    console.error('❌ Error creating stock movement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create stock movement',
      details: error.message
    });
  }
};

// Update product stock directly (for quick edits)
const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity, notes } = req.body;

    if (stock_quantity === undefined || stock_quantity === null) {
      return res.status(400).json({
        success: false,
        error: 'stock_quantity is required'
      });
    }

    const newStockQuantity = parseInt(stock_quantity);
    
    if (newStockQuantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Stock quantity cannot be negative'
      });
    }

    // Find the product first to get current stock and product_code
    const product = await prisma.productData.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Use transaction to update product and create adjustment movement
    const result = await prisma.$transaction(async (prisma) => {
      // Update product stock
      const updatedProduct = await prisma.productData.update({
        where: { id },
        data: { stock_quantity: newStockQuantity }
      });

      // Create stock movement record for tracking
      const stockMovement = await prisma.stockData.create({
        data: {
          product_code: product.product_code,
          movement_type: 'adjustment',
          quantity: newStockQuantity,
          reference_number: `MANUAL_UPDATE_${Date.now()}`,
          notes: notes || `Manual stock update from ${product.stock_quantity} to ${newStockQuantity}`,
          movement_date: new Date()
        }
      });

      return { updatedProduct, stockMovement };
    });

    console.log(`🔄 Updated stock for ${product.product_name}: ${product.stock_quantity} → ${newStockQuantity}`);

    res.json({
      success: true,
      data: result.updatedProduct,
      stockMovement: result.stockMovement,
      previousStock: product.stock_quantity,
      newStock: newStockQuantity,
      message: 'Product stock updated successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    console.error('❌ Error updating product stock:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product stock',
      details: error.message
    });
  }
};

// Get stock statistics
const getStockStats = async (req, res) => {
  try {
    const totalProducts = await prisma.productData.count();
    
    // Get all products to calculate low stock in memory
    const allProducts = await prisma.productData.findMany({
      select: {
        stock_quantity: true,
        min_stock: true
      }
    });

    const lowStockProducts = allProducts.filter(p => 
      p.stock_quantity > 0 && p.stock_quantity <= p.min_stock
    ).length;

    const outOfStockProducts = await prisma.productData.count({
      where: { stock_quantity: 0 }
    });

    // Get recent stock movements count
    const recentMovements = await prisma.stockData.count({
      where: {
        movement_date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    // Calculate total stock value
    const stockValue = await prisma.productData.aggregate({
      _sum: {
        stock_quantity: true
      },
      where: {
        stock_quantity: {
          gt: 0
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalStockItems: stockValue._sum.stock_quantity || 0,
        recentMovements
      }
    });
  } catch (error) {
    console.error('❌ Error fetching stock stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock statistics',
      details: error.message
    });
  }
};

// Get forecast data for Stock Forecasting Dashboard - Enhanced with real sales data integration
const getForecastData = async (req, res) => {
  try {
    const { limit = 500, type = 'all' } = req.query;

    console.log(`📈 Stock forecast data requested - limit: ${limit}, type: ${type}`);

    // Check if we have sales data first
    const salesCount = await prisma.salesData.count();
    console.log(`📊 Total sales records available: ${salesCount}`);

    if (salesCount === 0) {
      console.log('⚠️ No sales data available - returning empty forecast data');
      return res.json({
        success: true,
        data: [],
        count: 0,
        total: 0,
        metadata: {
          message: 'No sales data available for stock forecasting',
          last_updated: new Date().toISOString()
        }
      });
    }

    // Get sales data for stock requirement analysis (last 120 days for better forecasting)
    const salesData = await prisma.salesData.findMany({
      where: {
        delivered_time: {
          gte: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000) // Last 120 days
        }
      },
      select: {
        product_name: true,
        seller_sku: true,
        color: true,
        size: true,
        quantity: true,
        order_amount: true,
        settlement_amount: true,
        delivered_time: true,
        created_time: true,
        marketplace: true
      },
      orderBy: {
        delivered_time: 'desc'
      }
    });

    console.log(`📦 Retrieved ${salesData.length} sales records for stock forecasting`);

    // Group sales data by product to calculate stock requirements
    const productDemandMap = new Map();
    
    salesData.forEach(sale => {
      const productKey = `${sale.product_name}_${sale.color}_${sale.size}`;
      const quantity = parseInt(sale.quantity) || 0;
      const revenue = parseFloat(sale.settlement_amount || sale.order_amount) || 0;
      const saleDate = sale.delivered_time || sale.created_time;
      
      if (!productDemandMap.has(productKey)) {
        productDemandMap.set(productKey, {
          product_name: sale.product_name,
          color: sale.color,
          size: sale.size,
          seller_sku: sale.seller_sku,
          marketplace: sale.marketplace,
          total_sold: 0,
          total_revenue: 0,
          sale_dates: [],
          daily_sales: new Map(),
          avg_selling_price: 0
        });
      }

      const productData = productDemandMap.get(productKey);
      productData.total_sold += quantity;
      productData.total_revenue += revenue;
      productData.sale_dates.push(saleDate);
      
      // Track daily sales for better forecasting
      const dayKey = saleDate.toISOString().split('T')[0];
      const currentDaySales = productData.daily_sales.get(dayKey) || 0;
      productData.daily_sales.set(dayKey, currentDaySales + quantity);
      
      productData.avg_selling_price = productData.total_revenue / productData.total_sold;
    });

    console.log(`📊 Analyzed ${productDemandMap.size} unique product variants from sales data`);

    // Convert to stock forecast data with realistic calculations
    const forecastData = Array.from(productDemandMap.values()).map((product, index) => {
      // Calculate demand patterns
      const daysSinceLastSale = product.sale_dates.length > 0 ? 
        Math.floor((new Date() - new Date(Math.max(...product.sale_dates))) / (1000 * 60 * 60 * 24)) : 999;
      
      // Calculate average daily demand
      const activeDays = product.daily_sales.size;
      const avgDailyDemand = activeDays > 0 ? product.total_sold / 120 : 0; // Spread over 120 days
      const avgActiveDayDemand = activeDays > 0 ? product.total_sold / activeDays : 0;
      
      // Calculate stock requirements based on sales velocity
      const leadTime = 14; // 2 weeks lead time
      const safetyStock = Math.ceil(avgDailyDemand * 7); // 1 week safety stock
      const reorderPoint = Math.ceil(avgDailyDemand * leadTime) + safetyStock;
      const optimalStock = Math.ceil(avgDailyDemand * 30); // 30 days worth of stock
      
      // Estimate current stock based on recent sales (mock data for forecasting)
      const estimatedCurrentStock = Math.max(0, Math.round(optimalStock - (avgDailyDemand * daysSinceLastSale)));
      
      // Calculate stock movement (daily change simulation)
      const stockMovement = Math.round(-avgDailyDemand + (Math.random() - 0.5) * avgDailyDemand * 0.2);
      
      // Determine stock status
      let stockStatus = 'normal';
      if (estimatedCurrentStock === 0) {
        stockStatus = 'out_of_stock';
      } else if (estimatedCurrentStock <= reorderPoint * 0.5) {
        stockStatus = 'low_stock';
      } else if (estimatedCurrentStock <= reorderPoint) {
        stockStatus = 'reorder_needed';
      }

      // Calculate days until stockout
      const daysUntilStockout = avgDailyDemand > 0 ? 
        Math.floor(estimatedCurrentStock / avgDailyDemand) : 999;

      return {
        id: `stock_forecast_${index + 1}`,
        created_time: new Date().toISOString(),
        updated_time: new Date().toISOString(),
        product_name: product.product_name,
        color: product.color,
        size: product.size,
        seller_sku: product.seller_sku,
        current_stock: estimatedCurrentStock,
        stock_movement: stockMovement,
        stock_value: estimatedCurrentStock * product.avg_selling_price,
        category: 'Fashion', // Default category for D'Busana
        marketplace: product.marketplace || 'Multi-platform',
        location: 'Main Warehouse',
        reorder_point: reorderPoint,
        max_stock: optimalStock,
        unit_cost: product.avg_selling_price * 0.7, // Estimate 70% cost ratio
        
        // Enhanced forecasting metrics
        avg_daily_demand: parseFloat(avgDailyDemand.toFixed(2)),
        avg_active_day_demand: parseFloat(avgActiveDayDemand.toFixed(2)),
        total_sold_120d: product.total_sold,
        total_revenue_120d: product.total_revenue,
        days_since_last_sale: daysSinceLastSale,
        days_until_stockout: daysUntilStockout,
        stock_status: stockStatus,
        active_sales_days: activeDays,
        
        // Business metrics
        selling_price: product.avg_selling_price,
        turnover_rate: avgDailyDemand / Math.max(estimatedCurrentStock, 1),
        sales_velocity: activeDays / 120, // How often this product sells
        revenue_potential: avgDailyDemand * product.avg_selling_price * 30, // 30-day revenue potential
        
        // Forecasting confidence based on data quality
        forecast_accuracy: Math.min(0.95, 0.5 + (activeDays / 60)), // Higher accuracy with more sales data
        data_confidence: activeDays >= 10 ? 'high' : activeDays >= 5 ? 'medium' : 'low'
      };
    });

    // Sort by business priority
    forecastData.sort((a, b) => {
      const statusPriority = {
        'out_of_stock': 4,
        'low_stock': 3,
        'reorder_needed': 2,
        'normal': 1
      };
      
      const aPriority = statusPriority[a.stock_status] || 0;
      const bPriority = statusPriority[b.stock_status] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Secondary sort by revenue potential (highest first)
      return b.revenue_potential - a.revenue_potential;
    });

    // Filter by type if specified
    let filteredData = forecastData;
    if (type !== 'all') {
      switch (type) {
        case 'low_stock':
          filteredData = forecastData.filter(item => 
            item.stock_status === 'low_stock' || item.stock_status === 'out_of_stock'
          );
          break;
        case 'reorder':
          filteredData = forecastData.filter(item => item.stock_status === 'reorder_needed');
          break;
        case 'high_demand':
          filteredData = forecastData.filter(item => item.avg_daily_demand > 1);
          break;
        case 'high_revenue':
          filteredData = forecastData.filter(item => item.revenue_potential > 100000); // > 100k IDR potential
          break;
        default:
          break;
      }
    }

    // Apply limit
    const limitedData = filteredData.slice(0, parseInt(limit));

    console.log(`✅ Generated ${limitedData.length} stock forecast records from real sales data`);
    console.log(`📈 Stock analysis summary:`, {
      total_products: forecastData.length,
      out_of_stock: forecastData.filter(p => p.stock_status === 'out_of_stock').length,
      low_stock: forecastData.filter(p => p.stock_status === 'low_stock').length,
      reorder_needed: forecastData.filter(p => p.stock_status === 'reorder_needed').length,
      avg_daily_demand: (forecastData.reduce((sum, p) => sum + p.avg_daily_demand, 0) / forecastData.length).toFixed(2)
    });

    res.json({
      success: true,
      data: limitedData,
      count: limitedData.length,
      total: forecastData.length,
      metadata: {
        sales_data_period: '120 days',
        analysis_date: new Date().toISOString(),
        filter_type: type,
        data_source: 'sales_data',
        unique_products: productDemandMap.size,
        total_sales_records: salesData.length
      }
    });

  } catch (error) {
    console.error('❌ Error generating stock forecast data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate stock forecast data',
      details: error.message,
      data: []
    });
  }
};

module.exports = {
  getStock,
  getStockMovements,
  createStockMovement,
  updateProductStock,
  getStockHistory,
  getStockStats,
  getForecastData
};