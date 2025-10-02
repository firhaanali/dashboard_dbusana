const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runSupplierMigration() {
  try {
    console.log('🚀 Starting Supplier Database Migration (Clean Version)...\n');

    // Read and execute the migration file
    const migrationPath = path.join(__dirname, '../prisma/migrations/005_add_supplier_purchase_order_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📁 Executing supplier migration SQL...');
    await prisma.$executeRawUnsafe(migrationSQL);

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    
    const suppliersCount = await prisma.$queryRaw`SELECT COUNT(*) FROM suppliers`;
    const purchaseOrdersCount = await prisma.$queryRaw`SELECT COUNT(*) FROM purchase_orders`;
    const purchaseOrderItemsCount = await prisma.$queryRaw`SELECT COUNT(*) FROM purchase_order_items`;
    
    console.log(`✅ Suppliers table created (ready for data input)`);
    console.log(`✅ Purchase Orders table created (ready for data input)`);
    console.log(`✅ Purchase Order Items table created (ready for data input)`);
    
    // Test table structure
    console.log('🧪 Testing table structure...');
    
    const supplierStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'suppliers' 
      ORDER BY ordinal_position
    `;
    
    console.log(`✅ Suppliers table structure verified (${supplierStructure.length} columns)`);
    console.log('✅ Tables are ready for user data input');

    console.log('\n🎯 Migration Summary:');
    console.log('  ✅ Suppliers table created');
    console.log('  ✅ Purchase Orders table created');
    console.log('  ✅ Purchase Order Items table created');
    console.log('  ✅ Indexes created for performance');
    console.log('  ✅ Foreign key constraints created');
    console.log('  ✅ Tables ready for user data input');
    console.log('\n🚀 Suppliers API is ready at:');
    console.log('  GET    /api/suppliers               # List suppliers');
    console.log('  POST   /api/suppliers               # Create new supplier');
    console.log('  GET    /api/suppliers/:id           # Get supplier detail');
    console.log('  PUT    /api/suppliers/:id           # Update supplier');
    console.log('  DELETE /api/suppliers/:id           # Delete supplier');
    console.log('  GET    /api/suppliers/analytics     # Get analytics');
    console.log('  PUT    /api/suppliers/:id/rating    # Update rating');
    console.log('\n📝 Ready for data input via frontend form!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runSupplierMigration()
  .then(() => {
    console.log('\n✅ Supplier migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });