const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all products
const getProducts = async (req, res) => {
  try {
    const products = await prisma.productData.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`📦 Retrieved ${products.length} products from database`);

    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      details: error.message
    });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    const {
      product_code,
      product_name,
      category,
      brand,
      size,
      color,
      price,
      cost,
      stock_quantity,
      min_stock,
      description,
      seller_sku
    } = req.body;

    // Validate required fields
    if (!product_code || !product_name || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: product_code, product_name, category'
      });
    }

    // Check if product with same code already exists
    const existingProduct = await prisma.productData.findUnique({
      where: { product_code }
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        error: `Product with code ${product_code} already exists`
      });
    }

    // Create new product
    const newProduct = await prisma.productData.create({
      data: {
        product_code,
        product_name,
        category,
        brand: brand || 'D\'Busana',
        size: size || '',
        color: color || '',
        price: parseFloat(price) || 0,
        cost: parseFloat(cost) || 0,
        stock_quantity: parseInt(stock_quantity) || 0,
        min_stock: parseInt(min_stock) || 5,
        description: description || ''
      }
    });

    console.log(`✅ Created new product: ${newProduct.product_name} (${newProduct.product_code})`);

    res.status(201).json({
      success: true,
      data: newProduct,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product',
      details: error.message
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Convert numeric fields
    if (updateData.price !== undefined) {
      updateData.price = parseFloat(updateData.price) || 0;
    }
    if (updateData.cost !== undefined) {
      updateData.cost = parseFloat(updateData.cost) || 0;
    }
    if (updateData.stock_quantity !== undefined) {
      updateData.stock_quantity = parseInt(updateData.stock_quantity) || 0;
    }
    if (updateData.min_stock !== undefined) {
      updateData.min_stock = parseInt(updateData.min_stock) || 0;
    }

    const updatedProduct = await prisma.productData.update({
      where: { id },
      data: updateData
    });

    console.log(`🔄 Updated product: ${updatedProduct.product_name} (${updatedProduct.product_code})`);

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    console.error('❌ Error updating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product',
      details: error.message
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // First, get the product to check its product_code
    const productToDelete = await prisma.productData.findUnique({
      where: { id },
      select: {
        id: true,
        product_name: true,
        product_code: true
      }
    });

    if (!productToDelete) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // First, delete all stock movements related to this product
      const deletedStockMovements = await prisma.stockData.deleteMany({
        where: {
          product_code: productToDelete.product_code
        }
      });

      console.log(`🗑️ Deleted ${deletedStockMovements.count} stock movements for product ${productToDelete.product_code}`);

      // Then delete the product itself
      const deletedProduct = await prisma.productData.delete({
        where: { id }
      });

      return {
        deletedProduct,
        deletedStockMovements: deletedStockMovements.count
      };
    });

    console.log(`🗑️ Successfully deleted product: ${result.deletedProduct.product_name} (${result.deletedProduct.product_code}) and ${result.deletedStockMovements} related stock movements`);

    res.json({
      success: true,
      data: result.deletedProduct,
      message: `Product deleted successfully along with ${result.deletedStockMovements} related stock movements`
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    console.error('❌ Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product',
      details: error.message
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.productData.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
      details: error.message
    });
  }
};

// Search products
const searchProducts = async (req, res) => {
  try {
    const { q, category, brand } = req.query;

    let whereClause = {};

    if (q) {
      whereClause.OR = [
        { product_name: { contains: q, mode: 'insensitive' } },
        { product_code: { contains: q, mode: 'insensitive' } },
        { seller_sku: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (category && category !== 'all') {
      whereClause.category = category;
    }

    if (brand && brand !== 'all') {
      whereClause.brand = brand;
    }

    const products = await prisma.productData.findMany({
      where: whereClause,
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('❌ Error searching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search products',
      details: error.message
    });
  }
};

// Get product statistics
const getProductStats = async (req, res) => {
  try {
    const totalProducts = await prisma.productData.count();
    
    // Get all products to calculate low stock in memory since Prisma doesn't support field comparison easily
    const allProducts = await prisma.productData.findMany({
      select: {
        stock_quantity: true,
        min_stock: true,
        product_name: true
      }
    });

    const lowStockProducts = allProducts.filter(p => 
      p.stock_quantity > 0 && p.stock_quantity <= p.min_stock
    ).length;

    const outOfStockProducts = await prisma.productData.count({
      where: { stock_quantity: 0 }
    });

    const categories = await prisma.productData.groupBy({
      by: ['category'],
      _count: { category: true }
    });

    const brands = await prisma.productData.groupBy({
      by: ['brand'],
      _count: { brand: true }
    });

    // Calculate unique products by product name
    const uniqueProductNames = new Set(allProducts.map(p => p.product_name.toLowerCase().trim()));
    const totalUniqueProducts = uniqueProductNames.size;

    res.json({
      success: true,
      data: {
        totalProducts,
        totalSKU: totalProducts,
        totalUniqueProducts,
        lowStockProducts,
        outOfStockProducts,
        totalCategories: categories.length,
        totalBrands: brands.length,
        categories: categories.map(c => ({
          name: c.category,
          count: c._count.category
        })),
        brands: brands.map(b => ({
          name: b.brand,
          count: b._count.brand
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching product stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product statistics',
      details: error.message
    });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  searchProducts,
  getProductStats
};