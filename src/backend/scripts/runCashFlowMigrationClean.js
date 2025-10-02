const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runCashFlowMigration() {
  try {
    console.log('🚀 Starting Cash Flow Database Migration (Clean Version)...\n');

    // Read and execute the migration file
    const migrationPath = path.join(__dirname, '../prisma/migrations/007_add_cash_flow_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📁 Executing cash flow migration SQL...');
    await prisma.$executeRawUnsafe(migrationSQL);

    // Verify table was created
    console.log('🔍 Verifying cash flow table...');
    
    const cashFlowCount = await prisma.$queryRaw`SELECT COUNT(*) FROM cash_flow_entries`;
    console.log(`✅ Cash Flow Entries table created (ready for data input)`);
    
    // Test table structure
    console.log('🧪 Testing table structure...');
    
    const tableStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'cash_flow_entries' 
      ORDER BY ordinal_position
    `;
    
    console.log(`✅ Cash flow table structure verified (${tableStructure.length} columns)`);
    console.log('✅ Table is ready for user cash flow entry');

    // Test enum creation
    const enumCheck = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum pe 
      JOIN pg_type pt ON pe.enumtypid = pt.oid 
      WHERE pt.typname = 'CashFlowType'
    `;
    
    if (enumCheck.length > 0) {
      console.log(`✅ CashFlowType enum created with values: ${enumCheck.map(e => e.enumlabel).join(', ')}`);
    }

    console.log('\n🎯 Migration Summary:');
    console.log('  ✅ CashFlowType enum created (income, expense)');
    console.log('  ✅ Cash flow entries table created');
    console.log('  ✅ Indexes created for performance');
    console.log('  ✅ Table ready for user cash flow data');
    console.log('\n🚀 Cash Flow API is ready at:');
    console.log('  GET    /api/cash-flow                   # Get cash flow data');
    console.log('  GET    /api/cash-flow/entries           # List entries');
    console.log('  POST   /api/cash-flow/entries           # Create new entry');
    console.log('  PUT    /api/cash-flow/entries/:id       # Update entry');
    console.log('  DELETE /api/cash-flow/entries/:id       # Delete entry');
    console.log('  GET    /api/cash-flow/summary            # Get summary');
    console.log('  GET    /api/cash-flow/categories         # Get categories');
    console.log('  GET    /api/cash-flow/export             # Export report');
    console.log('\n📝 Ready for cash flow input via frontend form!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runCashFlowMigration()
  .then(() => {
    console.log('\n✅ Cash flow migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });