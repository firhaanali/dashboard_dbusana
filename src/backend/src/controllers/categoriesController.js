const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
};

// Get category by ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category'
    });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    // Check if category with same name exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        error: 'Category with this name already exists'
      });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || null
      }
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Check if another category with same name exists (excluding current one)
    const duplicateCategory = await prisma.category.findFirst({
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

    if (duplicateCategory) {
      return res.status(409).json({
        success: false,
        error: 'Another category with this name already exists'
      });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || null,
        updated_at: new Date()
      }
    });

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category'
    });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Check if category is being used by products
    const productsUsingCategory = await prisma.productData.findMany({
      where: { category: existingCategory.name }
    });

    // Start a transaction to update products and delete category
    await prisma.$transaction(async (prisma) => {
      // Update products that use this category to "Unknown"
      if (productsUsingCategory.length > 0) {
        await prisma.productData.updateMany({
          where: { category: existingCategory.name },
          data: { category: 'Unknown' }
        });
      }

      // Delete the category
      await prisma.category.delete({
        where: { id }
      });
    });

    res.json({
      success: true,
      message: `Category deleted successfully. ${productsUsingCategory.length} products updated to "Unknown" category.`,
      affectedProducts: productsUsingCategory.length
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
};

// Search categories
const searchCategories = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return getAllCategories(req, res);
    }

    const categories = await prisma.category.findMany({
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
          }
        ]
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error searching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search categories'
    });
  }
};

// Get category statistics
const getCategoryStats = async (req, res) => {
  try {
    // Get all categories
    const categories = await prisma.category.findMany();
    
    // Get all products to calculate category usage
    const products = await prisma.productData.findMany({
      select: {
        category: true
      }
    });

    // Calculate category product counts
    const categoryProductCounts = {};
    products.forEach(product => {
      const category = product.category || 'Unknown';
      categoryProductCounts[category] = (categoryProductCounts[category] || 0) + 1;
    });

    // Calculate stats
    const totalCategories = categories.length;
    const totalProducts = products.length;
    const categoriesWithProducts = Object.keys(categoryProductCounts).length;
    const emptyCategoriesCount = Math.max(0, totalCategories - categoriesWithProducts);

    const categoryProductCountsArray = Object.entries(categoryProductCounts)
      .map(([category, productCount]) => ({ category, productCount }))
      .sort((a, b) => b.productCount - a.productCount);

    const stats = {
      totalCategories,
      totalProducts,
      categoriesWithProducts,
      emptyCategoriesCount,
      categoryProductCounts: categoryProductCountsArray
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category statistics'
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  searchCategories,
  getCategoryStats
};