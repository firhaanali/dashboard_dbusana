const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all products with pagination and search
const getAllProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      kategori = '', 
      sortBy = 'created_at',
      sortOrder = 'desc' 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause for search and filters
    const where = {};
    
    if (search) {
      where.OR = [
        { nama_produk: { contains: search, mode: 'insensitive' } },
        { size: { contains: search, mode: 'insensitive' } },
        { kategori: { contains: search, mode: 'insensitive' } },
        { deskripsi: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (kategori) {
      where.kategori = { contains: kategori, mode: 'insensitive' };
    }

    // Get total count for pagination
    const total = await prisma.productHPP.count({ where });

    // Get products with pagination
    const products = await prisma.productHPP.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: offset,
      take: parseInt(limit)
    });

    // Calculate statistics
    const stats = await getProductStatistics();

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data produk',
      error: error.message
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.productHPP.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data produk',
      error: error.message
    });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    const { nama_produk, size, hpp, kategori, deskripsi } = req.body;

    // Validation
    if (!nama_produk || !hpp) {
      return res.status(400).json({
        success: false,
        message: 'Nama produk dan HPP harus diisi'
      });
    }

    if (hpp <= 0) {
      return res.status(400).json({
        success: false,
        message: 'HPP harus lebih dari 0'
      });
    }

    // Check for duplicate product name and size combination
    const existingProduct = await prisma.productHPP.findFirst({
      where: { 
        nama_produk: nama_produk.trim(),
        size: size?.trim() || null
      }
    });

    if (existingProduct) {
      const sizeText = size ? ` (size: ${size})` : '';
      return res.status(409).json({
        success: false,
        message: `Produk dengan nama dan size tersebut sudah ada${sizeText}`
      });
    }

    const product = await prisma.productHPP.create({
      data: {
        nama_produk: nama_produk.trim(),
        size: size?.trim() || null,
        hpp: parseFloat(hpp),
        kategori: kategori?.trim() || null,
        deskripsi: deskripsi?.trim() || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Produk dengan nama dan size tersebut sudah ada'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan produk',
      error: error.message
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_produk, size, hpp, kategori, deskripsi } = req.body;

    // Validation
    if (!nama_produk || !hpp) {
      return res.status(400).json({
        success: false,
        message: 'Nama produk dan HPP harus diisi'
      });
    }

    if (hpp <= 0) {
      return res.status(400).json({
        success: false,
        message: 'HPP harus lebih dari 0'
      });
    }

    // Check if product exists
    const existingProduct = await prisma.productHPP.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan'
      });
    }

    // Check for duplicate product name and size combination (excluding current product)
    const duplicateProduct = await prisma.productHPP.findFirst({
      where: { 
        nama_produk: nama_produk.trim(),
        size: size?.trim() || null,
        id: { not: id }
      }
    });

    if (duplicateProduct) {
      const sizeText = size ? ` (size: ${size})` : '';
      return res.status(409).json({
        success: false,
        message: `Produk dengan nama dan size tersebut sudah ada${sizeText}`
      });
    }

    const product = await prisma.productHPP.update({
      where: { id },
      data: {
        nama_produk: nama_produk.trim(),
        size: size?.trim() || null,
        hpp: parseFloat(hpp),
        kategori: kategori?.trim() || null,
        deskripsi: deskripsi?.trim() || null
      }
    });

    res.json({
      success: true,
      message: 'Produk berhasil diperbarui',
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Produk dengan nama dan size tersebut sudah ada'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui produk',
      error: error.message
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await prisma.productHPP.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Produk tidak ditemukan'
      });
    }

    await prisma.productHPP.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Produk berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus produk',
      error: error.message
    });
  }
};

// Bulk import products from Excel
const bulkImportProducts = async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Data produk tidak valid'
      });
    }

    const results = {
      success: 0,
      updated: 0,
      errors: []
    };

    for (let i = 0; i < products.length; i++) {
      const row = products[i];
      const rowNumber = i + 2; // Excel row number (accounting for header)

      try {
        // Validation
        if (!row.nama_produk || !row.nama_produk.trim()) {
          results.errors.push(`Baris ${rowNumber}: Nama produk tidak boleh kosong`);
          continue;
        }

        if (!row.hpp || row.hpp <= 0) {
          results.errors.push(`Baris ${rowNumber}: HPP harus lebih dari 0`);
          continue;
        }

        const productData = {
          nama_produk: row.nama_produk.trim(),
          size: row.size?.trim() || null,
          hpp: parseFloat(row.hpp),
          kategori: row.kategori?.trim() || null,
          deskripsi: row.deskripsi?.trim() || null
        };

        // Check if product exists with name and size combination
        const existingProduct = await prisma.productHPP.findFirst({
          where: { 
            nama_produk: productData.nama_produk,
            size: productData.size
          }
        });

        if (existingProduct) {
          // Update existing product
          await prisma.productHPP.update({
            where: { id: existingProduct.id },
            data: {
              hpp: productData.hpp,
              kategori: productData.kategori || existingProduct.kategori,
              deskripsi: productData.deskripsi || existingProduct.deskripsi
            }
          });
          results.updated++;
        } else {
          // Create new product
          await prisma.productHPP.create({
            data: productData
          });
          results.success++;
        }
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        results.errors.push(`Baris ${rowNumber}: ${error.message}`);
      }
    }

    const totalProcessed = results.success + results.updated;
    
    res.json({
      success: true,
      message: `Import selesai: ${totalProcessed} produk berhasil diproses`,
      data: results
    });
  } catch (error) {
    console.error('Error bulk importing products:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengimpor data produk',
      error: error.message
    });
  }
};

// Delete all products
const deleteAllProducts = async (req, res) => {
  try {
    const deleteResult = await prisma.productHPP.deleteMany({});

    res.json({
      success: true,
      message: `Berhasil menghapus ${deleteResult.count} produk`,
      deletedCount: deleteResult.count
    });
  } catch (error) {
    console.error('Error deleting all products:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus semua produk',
      error: error.message
    });
  }
};

// Get product statistics
const getProductStatistics = async () => {
  try {
    const total = await prisma.productHPP.count();
    
    if (total === 0) {
      return {
        totalProducts: 0,
        averageHPP: 0,
        maxHPP: 0,
        minHPP: 0,
        categories: []
      };
    }

    // Get HPP statistics
    const hppAggregation = await prisma.productHPP.aggregate({
      _avg: { hpp: true },
      _max: { hpp: true },
      _min: { hpp: true }
    });

    // Get unique categories
    const categories = await prisma.productHPP.findMany({
      select: { kategori: true },
      where: { kategori: { not: null } },
      distinct: ['kategori']
    });

    return {
      totalProducts: total,
      averageHPP: hppAggregation._avg.hpp || 0,
      maxHPP: hppAggregation._max.hpp || 0,
      minHPP: hppAggregation._min.hpp || 0,
      categories: categories.map(c => c.kategori).filter(Boolean)
    };
  } catch (error) {
    console.error('Error calculating statistics:', error);
    return {
      totalProducts: 0,
      averageHPP: 0,
      maxHPP: 0,
      minHPP: 0,
      categories: []
    };
  }
};

// Get statistics endpoint
const getStatistics = async (req, res) => {
  try {
    const stats = await getProductStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik',
      error: error.message
    });
  }
};

// Search products by name
const searchProducts = async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;
    
    const products = await prisma.productHPP.findMany({
      where: {
        OR: [
          { nama_produk: { contains: q, mode: 'insensitive' } },
          { size: { contains: q, mode: 'insensitive' } }
        ]
      },
      orderBy: [
        { nama_produk: 'asc' },
        { size: 'asc' }
      ],
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mencari produk',
      error: error.message
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts,
  deleteAllProducts,
  getStatistics,
  searchProducts
};