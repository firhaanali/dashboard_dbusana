const { execSync } = require('child_process');
const path = require('path');

async function fixMigrationSetup() {
  try {
    console.log('🔧 Starting Migration Setup Fix...');
    
    // Step 1: Regenerate Prisma Client
    console.log('\n📋 Step 1: Regenerating Prisma Client...');
    try {
      // Change to backend directory
      process.chdir(path.join(__dirname, '../..'));
      console.log('📁 Working directory:', process.cwd());
      
      // Generate Prisma client
      console.log('🔄 Running: npx prisma generate');
      const generateOutput = execSync('npx prisma generate', { encoding: 'utf8' });
      console.log('✅ Prisma Client generated successfully');
      console.log('📄 Output:', generateOutput);
    } catch (error) {
      console.error('❌ Failed to generate Prisma Client:', error.message);
      throw error;
    }

    // Step 2: Check database connection
    console.log('\n📋 Step 2: Checking Database Connection...');
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Test connection
      await prisma.$connect();
      console.log('✅ Database connection successful');
      
      // Check if tables exist by querying system tables
      try {
        const tablesResult = await prisma.$queryRaw`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('categories', 'brands', 'ProductData')
          ORDER BY table_name;
        `;
        
        console.log('📊 Existing tables:', tablesResult.map(t => t.table_name));
        
        const hasCategories = tablesResult.some(t => t.table_name === 'categories');
        const hasBrands = tablesResult.some(t => t.table_name === 'brands');
        const hasProducts = tablesResult.some(t => t.table_name === 'ProductData');
        
        console.log('🔍 Table status:');
        console.log(`   - Categories: ${hasCategories ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`   - Brands: ${hasBrands ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`   - ProductData: ${hasProducts ? '✅ EXISTS' : '❌ MISSING'}`);
        
        await prisma.$disconnect();
        
        return {
          hasCategories,
          hasBrands,
          hasProducts,
          needsMigration: !hasCategories || !hasBrands
        };
        
      } catch (error) {
        console.error('❌ Failed to check tables:', error.message);
        await prisma.$disconnect();
        throw error;
      }
      
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }

  } catch (error) {
    console.error('💥 Migration setup fix failed:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  fixMigrationSetup()
    .then((result) => {
      console.log('\n🎉 Migration Setup Fix completed!');
      if (result.needsMigration) {
        console.log('\n📋 Next Steps:');
        console.log('   1. Run: node src/scripts/runMigrationSafe.js');
        console.log('   2. Or use the web Migration Runner at /database-migration');
      } else {
        console.log('\n✅ All tables exist. Migration not needed.');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration setup fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixMigrationSetup };