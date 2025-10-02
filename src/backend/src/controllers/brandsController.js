const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all brands
const getAllBrands = async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({
      success: true,
      data: brands,
      count: brands.length
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brands'
    });
  }
};

// Get brand by ID
const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const brand = await prisma.brand.findUnique({
      where: { id }
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        error: 'Brand not found'
      });
    }

    res.json({
      success: true,
      data: brand
    });
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brand'
    });
  }
};

// Create new brand
const createBrand = async (req, res) => {
  try {
    const { name, description, website, logo_color, is_premium } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Brand name is required'
      });
    }

    // Check if brand with same name exists
    const existingBrand = await prisma.brand.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });

    if (existingBrand) {
      return res.status(409).json({
        success: false,
        error: 'Brand with this name already exists'
      });
    }

    const brand = await prisma.brand.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        website: website?.trim() || null,
        logo_color: logo_color || null,
        is_premium: is_premium || false
      }
    });

    res.status(201).json({
      success: true,
      data: brand,
      message: 'Brand created successfully'
    });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create brand'
    });
  }
};

// Update brand
const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, website, logo_color, is_premium } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Brand name is required'
      });
    }

    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id }
    });

    if (!existingBrand) {
      return res.status(404).json({
        success: false,
        error: 'Brand not found'
      });
    }

    // Check if another brand with same name exists (excluding current one)
    const duplicateBrand = await prisma.brand.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        },
        id: {
          not: id
        }
      }
    });

    if (duplicateBrand) {
      return res.status(409).json({
        success: false,
        error: 'Another brand with this name already exists'
      });
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        website: website?.trim() || null,
        logo_color: logo_color || null,
        is_premium: is_premium || false,
        updated_at: new Date()
      }
    });

    res.json({
      success: true,
      data: brand,
      message: 'Brand updated successfully'
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update brand'
    });
  }
};

// Delete brand
const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id }
    });

    if (!existingBrand) {
      return res.status(404).json({
        success: false,
        error: 'Brand not found'
      });
    }

    // Check if brand is being used by products
    const productsUsingBrand = await prisma.productData.findMany({
      where: { brand: existingBrand.name }
    });

    // Start a transaction to update products and delete brand
    await prisma.$transaction(async (prisma) => {
      // Update products that use this brand to "Unknown"
      if (productsUsingBrand.length > 0) {
        await prisma.productData.updateMany({
          where: { brand: existingBrand.name },
          data: { brand: 'Unknown' }
        });
      }

      // Delete the brand
      await prisma.brand.delete({
        where: { id }
      });
    });

    res.json({
      success: true,
      message: `Brand deleted successfully. ${productsUsingBrand.length} products updated to "Unknown" brand.`,
      affectedProducts: productsUsingBrand.length
    });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete brand'
    });
  }
};

// Search brands
const searchBrands = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return getAllBrands(req, res);
    }

    const brands = await prisma.brand.findMany({
      where: {
        OR: [
          {
            name: {
              contains: q,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: q,
              mode: 'insensitive'
            }
          },
          {
            website: {
              contains: q,
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({
      success: true,
      data: brands,
      count: brands.length
    });
  } catch (error) {
    console.error('Error searching brands:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search brands'
    });
  }
};

// Get brand statistics
const getBrandStats = async (req, res) => {
  try {
    // Get all brands
    const brands = await prisma.brand.findMany();
    
    // Get all products to calculate brand usage
    const products = await prisma.productData.findMany({
      select: {
        brand: true
      }
    });

    // Calculate brand product counts
    const brandProductCounts = {};
    products.forEach(product => {
      const brand = product.brand || 'Unknown';
      brandProductCounts[brand] = (brandProductCounts[brand] || 0) + 1;
    });

    // Calculate stats
    const totalBrands = brands.length;
    const totalProducts = products.length;
    const brandsWithProducts = Object.keys(brandProductCounts).length;
    const emptyBrandsCount = Math.max(0, totalBrands - brandsWithProducts);
    const premiumBrands = brands.filter(brand => brand.is_premium).length;

    const brandProductCountsArray = Object.entries(brandProductCounts)
      .map(([brand, productCount]) => ({ brand, productCount }))
      .sort((a, b) => b.productCount - a.productCount);

    const stats = {
      totalBrands,
      totalProducts,
      brandsWithProducts,
      emptyBrandsCount,
      premiumBrands,
      brandProductCounts: brandProductCountsArray
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching brand stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brand statistics'
    });
  }
};

module.exports = {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  searchBrands,
  getBrandStats
};