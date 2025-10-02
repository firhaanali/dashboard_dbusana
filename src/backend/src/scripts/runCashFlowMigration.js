const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runCashFlowMigration() {
  try {
    console.log('🚀 Starting Cash Flow migration...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../../prisma/migrations/007_add_cash_flow_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded from:', migrationPath);

    // Execute the migration - split into individual statements
    console.log('⚙️ Executing migration...');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt.length > 0 && 
        !stmt.startsWith('--') && 
        !stmt.startsWith('/*') &&
        stmt.toLowerCase() !== 'commit' &&
        stmt.toLowerCase() !== 'begin'
      );
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          console.log(`   ${i + 1}/${statements.length}: Executing statement...`);
          await prisma.$executeRawUnsafe(statement + ';');
          console.log(`   ✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Skip if already exists
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              (error.message.includes('relation') && error.message.includes('already exists'))) {
            console.log(`   ⚠️  Statement ${i + 1} skipped (already exists)`);
          } else {
            throw error; // Re-throw if it's not a "already exists" error
          }
        }
      }
    }

    console.log('✅ Cash Flow migration completed successfully!');
    console.log('📊 Cash Flow entries table created with sample data');

    // Verify the migration by counting records
    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM cash_flow_entries`;
    console.log(`🔍 Verification: ${count[0].count} cash flow entries found`);

    // Display sample data
    const sampleEntries = await prisma.$queryRaw`
      SELECT id, description, entry_type, amount, source, entry_date 
      FROM cash_flow_entries 
      ORDER BY entry_date DESC 
      LIMIT 5
    `;
    
    console.log('📝 Sample cash flow entries:');
    sampleEntries.forEach(entry => {
      console.log(`  - ${entry.entry_type.toUpperCase()}: ${entry.description} (${entry.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })})`);
    });

  } catch (error) {
    console.error('❌ Cash Flow migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runCashFlowMigration();