const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigrationSafe() {
  try {
    console.log('🔄 Starting SAFE migration: Add Categories and Brands tables...');
    
    // Execute CREATE TABLE statements one by one first
    console.log('\n📋 Step 1: Creating tables...');
    
    // Create Categories table
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "categories" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "color" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
        );
      `;
      console.log('✅ Categories table created/verified');
    } catch (error) {
      if (error.message.includes('already exists') || error.code === '42P07') {
        console.log('⚠️ Categories table already exists');
      } else {
        throw error;
      }
    }

    // Create unique index on categories
    try {
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "categories"("name");
      `;
      console.log('✅ Categories index created/verified');
    } catch (error) {
      if (error.message.includes('already exists') || error.code === '42P07') {
        console.log('⚠️ Categories index already exists');
      } else {
        console.log('⚠️ Categories index creation failed (non-critical):', error.message);
      }
    }

    // Create Brands table
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "brands" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "website" TEXT,
          "logo_color" TEXT,
          "is_premium" BOOLEAN NOT NULL DEFAULT false,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
        );
      `;
      console.log('✅ Brands table created/verified');
    } catch (error) {
      if (error.message.includes('already exists') || error.code === '42P07') {
        console.log('⚠️ Brands table already exists');
      } else {
        throw error;
      }
    }

    // Create unique index on brands
    try {
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "brands_name_key" ON "brands"("name");
      `;
      console.log('✅ Brands index created/verified');
    } catch (error) {
      if (error.message.includes('already exists') || error.code === '42P07') {
        console.log('⚠️ Brands index already exists');
      } else {
        console.log('⚠️ Brands index creation failed (non-critical):', error.message);
      }
    }

    console.log('\n📋 Step 2: Inserting default data...');

    // Insert default categories using Prisma methods for better error handling
    const defaultCategories = [
      {
        id: 'cat_default_1',
        name: 'Dress',
        description: 'Koleksi dress dan gaun',
        color: '#FF6B9D'
      },
      {
        id: 'cat_default_2',
        name: 'Blouse',
        description: 'Koleksi blouse dan atasan',
        color: '#4ECDC4'
      },
      {
        id: 'cat_default_3',
        name: 'Pants',
        description: 'Koleksi celana panjang dan pendek',
        color: '#45B7D1'
      },
      {
        id: 'cat_default_4',
        name: 'Skirt',
        description: 'Koleksi rok dan midi skirt',
        color: '#96CEB4'
      },
      {
        id: 'cat_default_5',
        name: 'Outer',
        description: 'Koleksi jaket dan cardigan',
        color: '#FFEAA7'
      }
    ];

    // Insert categories one by one
    for (const category of defaultCategories) {
      try {
        // Check if category exists
        const existingCategory = await prisma.$queryRaw`
          SELECT id FROM "categories" WHERE name = ${category.name} LIMIT 1;
        `;
        
        if (existingCategory.length === 0) {
          await prisma.$executeRaw`
            INSERT INTO "categories" (id, name, description, color, created_at, updated_at)
            VALUES (${category.id}, ${category.name}, ${category.description}, ${category.color}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
          `;
          console.log(`✅ Category "${category.name}" created`);
        } else {
          console.log(`⚠️ Category "${category.name}" already exists`);
        }
      } catch (error) {
        console.log(`⚠️ Failed to create category "${category.name}": ${error.message}`);
      }
    }

    // Insert default brands
    const defaultBrands = [
      {
        id: 'brand_default_1',
        name: "D'Busana Premium",
        description: "Koleksi premium D'Busana dengan kualitas terbaik",
        logo_color: '#6C5CE7',
        is_premium: true
      },
      {
        id: 'brand_default_2',
        name: "D'Busana Classic",
        description: "Koleksi classic everyday D'Busana",
        logo_color: '#74B9FF',
        is_premium: false
      },
      {
        id: 'brand_default_3',
        name: "D'Busana Casual",
        description: "Koleksi casual wear yang nyaman",
        logo_color: '#00B894',
        is_premium: false
      },
      {
        id: 'brand_default_4',
        name: "D'Busana Sport",
        description: "Koleksi sportswear dan activewear",
        logo_color: '#E17055',
        is_premium: false
      }
    ];

    // Insert brands one by one
    for (const brand of defaultBrands) {
      try {
        // Check if brand exists
        const existingBrand = await prisma.$queryRaw`
          SELECT id FROM "brands" WHERE name = ${brand.name} LIMIT 1;
        `;
        
        if (existingBrand.length === 0) {
          await prisma.$executeRaw`
            INSERT INTO "brands" (id, name, description, website, logo_color, is_premium, created_at, updated_at)
            VALUES (${brand.id}, ${brand.name}, ${brand.description}, null, ${brand.logo_color}, ${brand.is_premium}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
          `;
          console.log(`✅ Brand "${brand.name}" created`);
        } else {
          console.log(`⚠️ Brand "${brand.name}" already exists`);
        }
      } catch (error) {
        console.log(`⚠️ Failed to create brand "${brand.name}": ${error.message}`);
      }
    }

    // Verify that tables were created and data was inserted
    console.log('\n🔍 Verifying migration results...');
    
    try {
      const categoriesResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "categories";`;
      const categoriesCount = Number(categoriesResult[0].count);
      console.log(`✅ Categories table: ${categoriesCount} records found`);
    } catch (error) {
      console.error('❌ Categories table verification failed:', error.message);
    }

    try {
      const brandsResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "brands";`;
      const brandsCount = Number(brandsResult[0].count);
      console.log(`✅ Brands table: ${brandsCount} records found`);
    } catch (error) {
      console.error('❌ Brands table verification failed:', error.message);
    }

    // Test ProductData table is still working
    try {
      const productsResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "ProductData";`;
      const productsCount = Number(productsResult[0].count);
      console.log(`✅ ProductData table: ${productsCount} records found (preserved)`);
    } catch (error) {
      console.log('⚠️ ProductData table not found (this is normal if no products have been imported yet)');
    }

    console.log('\n🎉 Safe Migration completed successfully!');
    console.log('📊 Database now supports:');
    console.log('   - Category Management (/api/categories)');
    console.log('   - Brand Management (/api/brands)');
    console.log('   - Products Management (/api/products) - preserved');
    
  } catch (error) {
    console.error('❌ Safe Migration failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigrationSafe()
    .then(() => {
      console.log('🏁 Safe Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Safe Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrationSafe };