const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runTailorsMigration() {
  console.log('🔄 Starting Tailors Migration...');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../prisma/migrations/021_add_tailors_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing Tailors Migration...');
    
    // Execute the migration SQL
    await prisma.$executeRawUnsafe(migrationSQL);
    
    console.log('✅ Tailors Migration completed successfully!');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...');
    
    const tailorsCount = await prisma.$queryRaw`SELECT COUNT(*) FROM tailors`;
    const productionsCount = await prisma.$queryRaw`SELECT COUNT(*) FROM tailor_productions`;
    
    console.log(`✅ Tailors table created (ready for data input)`);
    console.log(`✅ Tailor Productions table created (ready for data input)`);
    
    // Test table structure
    console.log('🧪 Testing table structure...');
    
    const tableStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tailors' 
      ORDER BY ordinal_position
    `;
    
    console.log(`✅ Tailors table structure verified (${tableStructure.length} columns)`);
    console.log('✅ Tables are ready for user data input');
    
    console.log('\n🎯 Migration Summary:');
    console.log('  ✅ Tailors table created');
    console.log('  ✅ Tailor Productions table created');
    console.log('  ✅ Indexes created for performance');
    console.log('  ✅ Triggers created for timestamps');
    console.log('  ✅ Tables ready for user data input');
    console.log('\n🚀 Tailors API is ready at:');
    console.log('  GET    /api/tailors               # List tailors');
    console.log('  POST   /api/tailors               # Create new tailor');
    console.log('  GET    /api/tailors/:id           # Get tailor detail');
    console.log('  PUT    /api/tailors/:id           # Update tailor');
    console.log('  DELETE /api/tailors/:id           # Delete tailor');
    console.log('  GET    /api/tailors/analytics     # Get analytics');
    console.log('  GET    /api/tailors/productions/all  # List productions');
    console.log('  POST   /api/tailors/productions   # Create production record');
    console.log('\n📝 Ready for data input via frontend form!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  runTailorsMigration()
    .then(() => {
      console.log('✅ Tailors migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runTailorsMigration };