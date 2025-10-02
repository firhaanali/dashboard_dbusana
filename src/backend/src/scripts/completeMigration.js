const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Try to import Prisma Client with better error handling
let PrismaClient;
try {
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule.PrismaClient;
} catch (error) {
  console.error('❌ @prisma/client not found!');
  console.error('');
  console.error('🔧 SOLUTION: Run the setup script first:');
  console.error('   cd backend');
  console.error('   node src/scripts/fullSetupAndMigration.js');
  console.error('');
  console.error('⚡ Or install manually:');
  console.error('   npm install');
  console.error('   npx prisma generate');
  console.error('   node src/scripts/completeMigration.js');
  process.exit(1);
}

async function completeMigration() {
  let prisma;
  
  try {
    console.log('🚀 Starting Complete Migration Process...');
    console.log('════════════════════════════════════════════════════════');
    
    // Step 1: Setup and Preparation
    console.log('\n📋 STEP 1: Setup and Preparation');
    console.log('─────────────────────────────────────');
    
    // Ensure we're in the right directory
    const backendDir = path.join(__dirname, '../..');
    process.chdir(backendDir);
    console.log('📁 Working directory:', process.cwd());
    
    // Check if .env file exists
    const envPath = path.join(backendDir, '.env');
    if (!fs.existsSync(envPath)) {
      console.error('❌ .env file not found in backend directory');
      console.log('💡 Create .env file with DATABASE_URL=your_postgresql_connection_string');
      process.exit(1);
    }
    console.log('✅ Environment file found');

    // Step 2: Regenerate Prisma Client
    console.log('\n📋 STEP 2: Regenerate Prisma Client');
    console.log('─────────────────────────────────────');
    
    try {
      console.log('🔄 Generating Prisma Client...');
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma Client generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate Prisma Client');
      throw error;
    }

    // Step 3: Database Connection Test
    console.log('\n📋 STEP 3: Database Connection Test');
    console.log('─────────────────────────────────────');
    
    try {
      prisma = new PrismaClient();
      await prisma.$connect();
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      console.log('💡 Check your DATABASE_URL in .env file');
      throw error;
    }

    // Step 4: Check Current Database State
    console.log('\n📋 STEP 4: Check Current Database State');
    console.log('─────────────────────────────────────');
    
    let hasCategories = false;
    let hasBrands = false;
    let hasProducts = false;
    
    try {
      const tablesResult = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('categories', 'brands', 'ProductData')
        ORDER BY table_name;
      `;
      
      hasCategories = tablesResult.some(t => t.table_name === 'categories');
      hasBrands = tablesResult.some(t => t.table_name === 'brands');
      hasProducts = tablesResult.some(t => t.table_name === 'ProductData');
      
      console.log('🔍 Current database tables:');
      console.log(`   📊 Categories table: ${hasCategories ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`   📊 Brands table: ${hasBrands ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`   📊 ProductData table: ${hasProducts ? '✅ EXISTS' : (hasProducts === false ? '❌ MISSING' : '⚠️ NOT CHECKED')}`);
      
    } catch (error) {
      console.log('⚠️ Could not check existing tables (this is normal for new databases)');
    }

    // Step 5: Create Tables
    console.log('\n📋 STEP 5: Create Required Tables');
    console.log('─────────────────────────────────────');
    
    if (!hasCategories) {
      console.log('🔄 Creating Categories table...');
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
        
        await prisma.$executeRaw`
          CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "categories"("name");
        `;
        
        console.log('✅ Categories table created successfully');
      } catch (error) {
        if (error.code === '42P07') {
          console.log('✅ Categories table already exists');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ Categories table already exists');
    }

    if (!hasBrands) {
      console.log('🔄 Creating Brands table...');
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
        
        await prisma.$executeRaw`
          CREATE UNIQUE INDEX IF NOT EXISTS "brands_name_key" ON "brands"("name");
        `;
        
        console.log('✅ Brands table created successfully');
      } catch (error) {
        if (error.code === '42P07') {
          console.log('✅ Brands table already exists');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ Brands table already exists');
    }

    // Step 6: Insert Default Data
    console.log('\n📋 STEP 6: Insert Default Data');
    console.log('─────────────────────────────────────');
    
    // Insert default categories
    const defaultCategories = [
      { id: 'cat_default_1', name: 'Dress', description: 'Koleksi dress dan gaun', color: '#FF6B9D' },
      { id: 'cat_default_2', name: 'Blouse', description: 'Koleksi blouse dan atasan', color: '#4ECDC4' },
      { id: 'cat_default_3', name: 'Pants', description: 'Koleksi celana panjang dan pendek', color: '#45B7D1' },
      { id: 'cat_default_4', name: 'Skirt', description: 'Koleksi rok dan midi skirt', color: '#96CEB4' },
      { id: 'cat_default_5', name: 'Outer', description: 'Koleksi jaket dan cardigan', color: '#FFEAA7' }
    ];

    let categoriesInserted = 0;
    for (const category of defaultCategories) {
      try {
        const existingCount = await prisma.$queryRaw`
          SELECT COUNT(*)::int as count FROM "categories" WHERE name = ${category.name};
        `;
        
        if (existingCount[0].count === 0) {
          await prisma.$executeRaw`
            INSERT INTO "categories" (id, name, description, color, created_at, updated_at)
            VALUES (${category.id}, ${category.name}, ${category.description}, ${category.color}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
          `;
          categoriesInserted++;
          console.log(`✅ Category "${category.name}" created`);
        } else {
          console.log(`⚠️ Category "${category.name}" already exists`);
        }
      } catch (error) {
        console.log(`❌ Failed to create category "${category.name}": ${error.message}`);
      }
    }

    // Insert default brands
    const defaultBrands = [
      { id: 'brand_default_1', name: "D'Busana Premium", description: "Koleksi premium D'Busana dengan kualitas terbaik", logo_color: '#6C5CE7', is_premium: true },
      { id: 'brand_default_2', name: "D'Busana Classic", description: "Koleksi classic everyday D'Busana", logo_color: '#74B9FF', is_premium: false },
      { id: 'brand_default_3', name: "D'Busana Casual", description: "Koleksi casual wear yang nyaman", logo_color: '#00B894', is_premium: false },
      { id: 'brand_default_4', name: "D'Busana Sport", description: "Koleksi sportswear dan activewear", logo_color: '#E17055', is_premium: false }
    ];

    let brandsInserted = 0;
    for (const brand of defaultBrands) {
      try {
        const existingCount = await prisma.$queryRaw`
          SELECT COUNT(*)::int as count FROM "brands" WHERE name = ${brand.name};
        `;
        
        if (existingCount[0].count === 0) {
          await prisma.$executeRaw`
            INSERT INTO "brands" (id, name, description, website, logo_color, is_premium, created_at, updated_at)
            VALUES (${brand.id}, ${brand.name}, ${brand.description}, null, ${brand.logo_color}, ${brand.is_premium}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
          `;
          brandsInserted++;
          console.log(`✅ Brand "${brand.name}" created`);
        } else {
          console.log(`⚠️ Brand "${brand.name}" already exists`);
        }
      } catch (error) {
        console.log(`❌ Failed to create brand "${brand.name}": ${error.message}`);
      }
    }

    // Step 7: Final Verification
    console.log('\n📋 STEP 7: Final Verification');
    console.log('─────────────────────────────────────');
    
    try {
      const categoriesCount = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "categories";`;
      const brandsCount = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "brands";`;
      
      console.log(`📊 Categories: ${categoriesCount[0].count} records (${categoriesInserted} new)`);
      console.log(`📊 Brands: ${brandsCount[0].count} records (${brandsInserted} new)`);
      
      // Test ProductData table
      try {
        const productsCount = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "ProductData";`;
        console.log(`📊 ProductData: ${productsCount[0].count} records (preserved)`);
      } catch (error) {
        console.log('📊 ProductData: Table not found (normal for new installations)');
      }
      
    } catch (error) {
      console.error('❌ Final verification failed:', error.message);
      throw error;
    }

    // Step 8: Success Summary
    console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('════════════════════════════════════════════════════════');
    console.log('✅ Database is now ready for all features:');
    console.log('   📂 Category Management (/api/categories)');
    console.log('   📂 Brand Management (/api/brands)');
    console.log('   📂 Products Management (/api/products)');
    console.log('');
    console.log('🌐 Frontend pages now available:');
    console.log('   • http://localhost:3000/categories');
    console.log('   • http://localhost:3000/brands');
    console.log('   • http://localhost:3000/products');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Restart your backend server (npm run dev)');
    console.log('   2. Refresh your frontend');
    console.log('   3. Test the Category and Brand management features');

  } catch (error) {
    console.error('\n💥 MIGRATION FAILED!');
    console.error('════════════════════════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   1. Check your DATABASE_URL in backend/.env');
    console.error('   2. Ensure PostgreSQL is running');
    console.error('   3. Ensure database exists and is accessible');
    console.error('   4. Try running: npx prisma db push (alternative method)');
    
    process.exit(1);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

// Run if this script is executed directly
if (require.main === module) {
  completeMigration()
    .then(() => {
      console.log('\n🏁 Complete Migration script finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Complete Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { completeMigration };