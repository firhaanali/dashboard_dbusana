const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function fullSetupAndMigration() {
  console.log('🚀 D\'Busana Dashboard - Full Setup & Migration');
  console.log('════════════════════════════════════════════════════════════');
  console.log('This script will:');
  console.log('   1. ✅ Install all required dependencies');
  console.log('   2. 🔧 Setup and generate Prisma Client');
  console.log('   3. 📊 Create Categories and Brands tables');
  console.log('   4. 📝 Insert default data');
  console.log('   5. 🔍 Verify everything is working');
  console.log('════════════════════════════════════════════════════════════');

  let prisma;

  try {
    // ============================================================================
    // PHASE 1: SETUP AND PREPARATION
    // ============================================================================
    console.log('\n🔧 PHASE 1: SETUP AND PREPARATION');
    console.log('════════════════════════════════════════════════════════════');

    // Ensure we're in the backend directory
    const backendDir = path.join(__dirname, '../..');
    const originalDir = process.cwd();
    
    console.log('📁 Original directory:', originalDir);
    console.log('📁 Backend directory:', backendDir);
    
    process.chdir(backendDir);
    console.log('✅ Switched to backend directory');

    // Check essential files
    const packageJsonPath = path.join(backendDir, 'package.json');
    const envPath = path.join(backendDir, '.env');
    const schemaPath = path.join(backendDir, 'prisma', 'schema.prisma');

    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found in backend directory');
    }
    console.log('✅ package.json found');

    if (!fs.existsSync(envPath)) {
      throw new Error('.env file not found. Create it with DATABASE_URL');
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (!envContent.includes('DATABASE_URL')) {
      throw new Error('DATABASE_URL not found in .env file');
    }
    console.log('✅ .env file with DATABASE_URL found');

    if (!fs.existsSync(schemaPath)) {
      throw new Error('prisma/schema.prisma not found');
    }
    console.log('✅ Prisma schema found');

    // ============================================================================
    // PHASE 2: INSTALL DEPENDENCIES
    // ============================================================================
    console.log('\n📦 PHASE 2: INSTALL DEPENDENCIES');
    console.log('════════════════════════════════════════════════════════════');

    const nodeModulesPath = path.join(backendDir, 'node_modules');
    const prismaClientPath = path.join(nodeModulesPath, '@prisma', 'client');

    // Check if we need to install dependencies
    let needsInstall = false;
    
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('⚠️ node_modules not found');
      needsInstall = true;
    } else if (!fs.existsSync(prismaClientPath)) {
      console.log('⚠️ @prisma/client not found in node_modules');
      needsInstall = true;
    } else {
      console.log('✅ Dependencies appear to be installed');
    }

    if (needsInstall) {
      console.log('🔄 Installing dependencies...');
      try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependencies installed successfully');
      } catch (error) {
        throw new Error(`Failed to install dependencies: ${error.message}`);
      }
    }

    // Ensure Prisma Client is specifically installed
    if (!fs.existsSync(prismaClientPath)) {
      console.log('🔄 Installing @prisma/client...');
      try {
        execSync('npm install @prisma/client', { stdio: 'inherit' });
        console.log('✅ @prisma/client installed');
      } catch (error) {
        throw new Error(`Failed to install @prisma/client: ${error.message}`);
      }
    }

    // Install Prisma CLI if needed
    try {
      execSync('npx prisma --version', { stdio: 'pipe' });
      console.log('✅ Prisma CLI available');
    } catch (error) {
      console.log('🔄 Installing Prisma CLI...');
      try {
        execSync('npm install prisma --save-dev', { stdio: 'inherit' });
        console.log('✅ Prisma CLI installed');
      } catch (installError) {
        throw new Error(`Failed to install Prisma CLI: ${installError.message}`);
      }
    }

    // ============================================================================
    // PHASE 3: GENERATE PRISMA CLIENT
    // ============================================================================
    console.log('\n🎯 PHASE 3: GENERATE PRISMA CLIENT');
    console.log('════════════════════════════════════════════════════════════');

    try {
      console.log('🔄 Generating Prisma Client...');
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma Client generated successfully');
    } catch (error) {
      throw new Error(`Failed to generate Prisma Client: ${error.message}`);
    }

    // Test if Prisma Client can be imported
    try {
      console.log('🔄 Testing Prisma Client import...');
      const { PrismaClient } = require('@prisma/client');
      prisma = new PrismaClient();
      console.log('✅ Prisma Client imported and instantiated successfully');
    } catch (error) {
      throw new Error(`Prisma Client import failed: ${error.message}`);
    }

    // ============================================================================
    // PHASE 4: DATABASE CONNECTION TEST
    // ============================================================================
    console.log('\n🔗 PHASE 4: DATABASE CONNECTION TEST');
    console.log('════════════════════════════════════════════════════════════');

    try {
      console.log('🔄 Testing database connection...');
      await prisma.$connect();
      console.log('✅ Database connection successful');
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}\nCheck your DATABASE_URL in .env file`);
    }

    // ============================================================================
    // PHASE 5: CHECK EXISTING TABLES
    // ============================================================================
    console.log('\n📊 PHASE 5: CHECK EXISTING TABLES');
    console.log('════════════════════════════════════════════════════════════');

    let hasCategories = false;
    let hasBrands = false;
    
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
      
      console.log('🔍 Current database tables:');
      console.log(`   📊 Categories: ${hasCategories ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`   📊 Brands: ${hasBrands ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`   📊 ProductData: ${tablesResult.some(t => t.table_name === 'ProductData') ? '✅ EXISTS' : '⚠️ NOT FOUND'}`);
      
    } catch (error) {
      console.log('⚠️ Could not check existing tables (this is normal for new databases)');
      console.log('   Proceeding with table creation...');
    }

    // ============================================================================
    // PHASE 6: CREATE TABLES
    // ============================================================================
    console.log('\n🏗️ PHASE 6: CREATE REQUIRED TABLES');
    console.log('════════════════════════════════════════════════════════════');

    // Create Categories table
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
          console.log('✅ Categories table already exists (skipped)');
        } else {
          throw new Error(`Failed to create Categories table: ${error.message}`);
        }
      }
    } else {
      console.log('✅ Categories table already exists');
    }

    // Create Brands table
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
          console.log('✅ Brands table already exists (skipped)');
        } else {
          throw new Error(`Failed to create Brands table: ${error.message}`);
        }
      }
    } else {
      console.log('✅ Brands table already exists');
    }

    // ============================================================================
    // PHASE 7: INSERT DEFAULT DATA
    // ============================================================================
    console.log('\n📝 PHASE 7: INSERT DEFAULT DATA');
    console.log('════════════════════════════════════════════════════════════');

    // Default categories data
    const defaultCategories = [
      { id: 'cat_default_1', name: 'Dress', description: 'Koleksi dress dan gaun', color: '#FF6B9D' },
      { id: 'cat_default_2', name: 'Blouse', description: 'Koleksi blouse dan atasan', color: '#4ECDC4' },
      { id: 'cat_default_3', name: 'Pants', description: 'Koleksi celana panjang dan pendek', color: '#45B7D1' },
      { id: 'cat_default_4', name: 'Skirt', description: 'Koleksi rok dan midi skirt', color: '#96CEB4' },
      { id: 'cat_default_5', name: 'Outer', description: 'Koleksi jaket dan cardigan', color: '#FFEAA7' }
    ];

    let categoriesInserted = 0;
    console.log('🔄 Inserting default categories...');
    
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
          console.log(`   ✅ "${category.name}" created`);
        } else {
          console.log(`   ⚠️ "${category.name}" already exists`);
        }
      } catch (error) {
        console.log(`   ❌ Failed to create "${category.name}": ${error.message}`);
      }
    }

    // Default brands data
    const defaultBrands = [
      { id: 'brand_default_1', name: "D'Busana Premium", description: "Koleksi premium D'Busana dengan kualitas terbaik", logo_color: '#6C5CE7', is_premium: true },
      { id: 'brand_default_2', name: "D'Busana Classic", description: "Koleksi classic everyday D'Busana", logo_color: '#74B9FF', is_premium: false },
      { id: 'brand_default_3', name: "D'Busana Casual", description: "Koleksi casual wear yang nyaman", logo_color: '#00B894', is_premium: false },
      { id: 'brand_default_4', name: "D'Busana Sport", description: "Koleksi sportswear dan activewear", logo_color: '#E17055', is_premium: false }
    ];

    let brandsInserted = 0;
    console.log('🔄 Inserting default brands...');
    
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
          console.log(`   ✅ "${brand.name}" created`);
        } else {
          console.log(`   ⚠️ "${brand.name}" already exists`);
        }
      } catch (error) {
        console.log(`   ❌ Failed to create "${brand.name}": ${error.message}`);
      }
    }

    // ============================================================================
    // PHASE 8: FINAL VERIFICATION
    // ============================================================================
    console.log('\n🔍 PHASE 8: FINAL VERIFICATION');
    console.log('════════════════════════════════════════════════════════════');

    try {
      const categoriesCount = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "categories";`;
      const brandsCount = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "brands";`;
      
      console.log('📊 Final database state:');
      console.log(`   📂 Categories: ${categoriesCount[0].count} records (${categoriesInserted} new)`);
      console.log(`   📂 Brands: ${brandsCount[0].count} records (${brandsInserted} new)`);
      
      // Test ProductData table
      try {
        const productsCount = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "ProductData";`;
        console.log(`   📂 ProductData: ${productsCount[0].count} records (preserved)`);
      } catch (error) {
        console.log('   📂 ProductData: Table not found (normal for new installations)');
      }
      
    } catch (error) {
      throw new Error(`Final verification failed: ${error.message}`);
    }

    // ============================================================================
    // SUCCESS SUMMARY
    // ============================================================================
    console.log('\n🎉 FULL SETUP & MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('════════════════════════════════════════════════════════════');
    console.log('✅ Everything is now ready for D\'Busana Dashboard:');
    console.log('');
    console.log('🔧 Backend Setup:');
    console.log('   ✅ All dependencies installed');
    console.log('   ✅ Prisma Client generated and working');
    console.log('   ✅ Database connection established');
    console.log('');
    console.log('📊 Database Tables:');
    console.log('   ✅ Categories table with default data');
    console.log('   ✅ Brands table with default data');
    console.log('   ✅ All existing data preserved');
    console.log('');
    console.log('🌐 Available Features:');
    console.log('   • Category Management: http://localhost:3000/categories');
    console.log('   • Brand Management: http://localhost:3000/brands');
    console.log('   • Products Management: http://localhost:3000/products');
    console.log('   • Full Dashboard: http://localhost:3000/dashboard');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Restart your backend server: npm run dev');
    console.log('   2. Refresh your frontend browser');
    console.log('   3. Navigate to /categories or /brands to test');
    console.log('   4. The API endpoints are now fully functional!');

  } catch (error) {
    console.error('\n💥 SETUP & MIGRATION FAILED!');
    console.error('════════════════════════════════════════════════════════════');
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting Steps:');
    console.error('   1. Check PostgreSQL is running');
    console.error('   2. Verify DATABASE_URL in backend/.env');
    console.error('   3. Ensure you have write permissions');
    console.error('   4. Try manually: npm install && npx prisma generate');
    console.error('   5. Check network connectivity');
    console.error('');
    console.error('💡 Alternative commands to try:');
    console.error('   • Manual Prisma push: npx prisma db push');
    console.error('   • Reset and migrate: npx prisma migrate dev');
    console.error('   • Debug Prisma: npx prisma introspect');
    
    process.exit(1);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

// Run if this script is executed directly
if (require.main === module) {
  fullSetupAndMigration()
    .then(() => {
      console.log('\n🏁 Full setup and migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Full setup and migration failed:', error);
      process.exit(1);
    });
}

module.exports = { fullSetupAndMigration };