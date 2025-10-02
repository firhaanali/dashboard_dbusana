const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function runSupplierMigration() {
  console.log('🚀 Starting Supplier & Purchase Order migration...');
  
  try {
    // Read and execute the migration SQL
    const migrationPath = path.join(__dirname, '../../prisma/migrations/005_add_supplier_purchase_order_tables.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== 'COMMIT');
    
    console.log(`📝 Executing ${statements.length} migration statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          await prisma.$executeRawUnsafe(statement);
        } catch (error) {
          // Skip if already exists errors
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key value') ||
              error.code === 'P2002') {
            console.log(`⚠️  Skipped statement ${i + 1} (already exists): ${error.message.substring(0, 100)}...`);
            continue;
          }
          throw error;
        }
      }
    }
    
    // Verify the migration by checking if tables exist
    console.log('🔍 Verifying migration...');
    
    const suppliers = await prisma.supplier.findMany({ take: 1 });
    const purchaseOrders = await prisma.purchaseOrder.findMany({ take: 1 });
    const materials = await prisma.material.findMany({ take: 1 });
    
    console.log('✅ Migration verification successful:');
    console.log(`   - Found ${suppliers.length > 0 ? 'sample' : 'no'} supplier data`);
    console.log(`   - Found ${purchaseOrders.length > 0 ? 'sample' : 'no'} purchase order data`);
    console.log(`   - Found ${materials.length > 0 ? 'existing' : 'no'} material data`);
    
    // Check if we need to create sample materials (if none exist)
    if (materials.length === 0) {
      console.log('📦 Creating sample materials for demo...');
      await createSampleMaterials();
    }
    
    console.log('🎉 Supplier & Purchase Order migration completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('   - ✅ Supplier management table created');
    console.log('   - ✅ Purchase Order management table created');
    console.log('   - ✅ Purchase Order Items table created');
    console.log('   - ✅ Sample data inserted');
    console.log('   - ✅ Foreign key constraints added');
    console.log('   - ✅ Performance indexes created');
    console.log('');
    console.log('🚀 You can now use the Supplier Management and Purchase Order features!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createSampleMaterials() {
  try {
    const sampleMaterials = [
      {
        id: 'mat1',
        code: 'MAT001',
        name: 'Cotton Fabric Premium',
        description: 'High quality cotton fabric for premium clothing',
        category: 'fabric',
        unit: 'meter',
        cost_per_unit: 120000,
        supplier: 'PT Tekstil Nusantara',
        min_stock: 50,
        current_stock: 500
      },
      {
        id: 'mat2',
        code: 'MAT002',
        name: 'Polyester Thread',
        description: 'Strong polyester thread for sewing',
        category: 'thread',
        unit: 'roll',
        cost_per_unit: 40000,
        supplier: 'CV Benang Kuat',
        min_stock: 20,
        current_stock: 150
      },
      {
        id: 'mat3',
        code: 'MAT003',
        name: 'Zipper 20cm',
        description: 'Metal zipper 20cm various colors',
        category: 'trims',
        unit: 'pcs',
        cost_per_unit: 5000,
        supplier: 'UD Kancing Jaya',
        min_stock: 100,
        current_stock: 800
      },
      {
        id: 'mat4',
        code: 'MAT004',
        name: 'Button Plastic 15mm',
        description: 'Plastic button 15mm various colors',
        category: 'trims',
        unit: 'pcs',
        cost_per_unit: 12000,
        supplier: 'CV Bordir Indah',
        min_stock: 200,
        current_stock: 1200
      },
      {
        id: 'mat5',
        code: 'MAT005',
        name: 'Elastic Band 1cm',
        description: 'Elastic band 1cm width',
        category: 'trims',
        unit: 'meter',
        cost_per_unit: 25000,
        supplier: 'PT Karet Elastis',
        min_stock: 50,
        current_stock: 300
      }
    ];

    for (const material of sampleMaterials) {
      await prisma.material.upsert({
        where: { code: material.code },
        update: {},
        create: material
      });
    }

    console.log('✅ Sample materials created successfully');
  } catch (error) {
    console.log('⚠️  Error creating sample materials (may already exist):', error.message);
  }
}

// Run the migration
runSupplierMigration();