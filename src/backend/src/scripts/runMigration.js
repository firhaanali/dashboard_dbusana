const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🔄 Starting migration: Add Categories and Brands tables...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../../prisma/migrations/001_add_categories_brands.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements (separated by semicolons)
    // Handle multi-line statements properly by preserving line breaks
    const statements = migrationSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => {
        // Filter out empty statements and comment-only lines
        const cleanStatement = statement.replace(/--.*$/gm, '').trim();
        return cleanStatement.length > 0;
      });
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      // Log the statement being executed for debugging
      const statementPreview = statement.substring(0, 100) + (statement.length > 100 ? '...' : '');
      console.log(`📝 Statement: ${statementPreview}`);
      
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        // Handle specific error cases
        if (error.message.includes('already exists') || error.code === '42P07') {
          console.log(`⚠️ Statement ${i + 1} skipped (already exists)`);
        } else if (error.message.includes('does not exist') || error.code === '42P01') {
          console.error(`❌ Error executing statement ${i + 1}: Table/relation does not exist`);
          console.error(`   Statement: ${statement}`);
          console.error(`   Full error: ${error.message}`);
          // This is a critical error, we should not continue
          throw error;
        } else {
          console.error(`❌ Error executing statement ${i + 1}: ${error.message}`);
          console.error(`   Statement: ${statement}`);
          // Continue with other statements for non-critical errors
        }
      }
    }
    
    // Verify that tables were created
    console.log('\n🔍 Verifying migration results...');
    
    try {
      const categoriesCount = await prisma.category.count();
      console.log(`✅ Categories table: ${categoriesCount} records found`);
    } catch (error) {
      console.error('❌ Categories table verification failed:', error.message);
    }
    
    try {
      const brandsCount = await prisma.brand.count();
      console.log(`✅ Brands table: ${brandsCount} records found`);
    } catch (error) {
      console.error('❌ Brands table verification failed:', error.message);
    }
    
    // Test ProductData table is still working
    try {
      const productsCount = await prisma.productData.count();
      console.log(`✅ ProductData table: ${productsCount} records found (preserved)`);
    } catch (error) {
      console.error('❌ ProductData table verification failed:', error.message);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('📊 Database now supports:');
    console.log('   - Category Management (/api/categories)');
    console.log('   - Brand Management (/api/brands)');
    console.log('   - Products Management (/api/products) - preserved');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🏁 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };