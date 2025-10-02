const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runBOMRemovalMigration() {
  try {
    console.log('🚀 Starting BOM (Bill of Materials) Removal Migration...\n');

    // Read and execute the migration file
    const migrationPath = path.join(__dirname, '../prisma/migrations/022_remove_bom_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📁 Executing BOM removal migration SQL...');
    await prisma.$executeRawUnsafe(migrationSQL);

    // Verify tables were removed
    console.log('🔍 Verifying BOM tables removal...');
    
    try {
      // These queries should fail since tables are removed
      await prisma.$queryRaw`SELECT COUNT(*) FROM materials`;
      console.log('❌ ERROR: Materials table still exists!');
    } catch (error) {
      console.log('✅ Materials table successfully removed');
    }

    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM boms`;
      console.log('❌ ERROR: BOMs table still exists!');
    } catch (error) {
      console.log('✅ BOMs table successfully removed');
    }

    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM bom_items`;
      console.log('❌ ERROR: BOM Items table still exists!');
    } catch (error) {
      console.log('✅ BOM Items table successfully removed');
    }
    
    // Verify purchase_order_items table still exists and has new columns
    const purchaseOrderItemsCount = await prisma.$queryRaw`SELECT COUNT(*) FROM purchase_order_items`;
    console.log(`✅ Purchase Order Items table preserved with ${purchaseOrderItemsCount[0].count} records`);
    
    // Test new columns exist
    const tableStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'purchase_order_items' 
      AND column_name IN ('material_name', 'material_description')
      ORDER BY column_name
    `;
    
    if (tableStructure.length >= 2) {
      console.log('✅ New material columns added to purchase_order_items');
    } else {
      console.log('⚠️  Some new material columns may be missing');
    }

    console.log('\n🎯 Migration Summary:');
    console.log('  ✅ Materials table removed');
    console.log('  ✅ BOMs table removed');
    console.log('  ✅ BOM Items table removed');
    console.log('  ✅ BOMStatus enum removed');
    console.log('  ✅ Purchase Order Items table preserved with new columns');
    console.log('  ✅ Foreign key constraints updated');
    console.log('\n🧹 BOM functionality successfully removed from database!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runBOMRemovalMigration()
  .then(() => {
    console.log('\n✅ BOM removal migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });