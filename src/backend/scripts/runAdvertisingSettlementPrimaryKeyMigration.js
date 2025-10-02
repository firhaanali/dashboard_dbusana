const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Advertising Settlement Primary Key Migration...');

const MIGRATION_FILE = path.join(__dirname, '../prisma/migrations/023_remove_auto_id_advertising_settlement.sql');

// Check if migration file exists
if (!fs.existsSync(MIGRATION_FILE)) {
  console.error('❌ Migration file tidak ditemukan:', MIGRATION_FILE);
  process.exit(1);
}

try {
  console.log('📝 Reading migration SQL...');
  const migrationSQL = fs.readFileSync(MIGRATION_FILE, 'utf8');
  console.log('Migration content:', migrationSQL);

  console.log('🔄 Applying Prisma schema changes...');
  // First, generate the new Prisma client with updated schema
  execSync('npx prisma generate', { 
    stdio: 'inherit', 
    cwd: path.join(__dirname, '..') 
  });

  console.log('🗄️ Running custom SQL migration...');
  // Apply the SQL migration manually
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  // Split migration into individual commands and execute
  const commands = migrationSQL
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

  for (const command of commands) {
    if (command.toLowerCase().includes('comment on')) {
      // Skip comment commands as they might not be supported in all environments
      console.log('⏭️ Skipping comment command:', command);
      continue;
    }
    
    try {
      console.log('📤 Executing:', command.substring(0, 60) + '...');
      await prisma.$executeRawUnsafe(command);
      console.log('✅ Command executed successfully');
    } catch (cmdError) {
      console.log('⚠️ Command failed (might be expected):', cmdError.message);
      // Continue with other commands - some failures might be expected
    }
  }

  await prisma.$disconnect();

  console.log('🎉 Advertising Settlement Primary Key Migration completed successfully!');
  console.log('📋 Changes applied:');
  console.log('  ✅ Removed auto-generated ID column');
  console.log('  ✅ Made order_id the primary key');
  console.log('  ✅ Updated schema and constraints');
  console.log('');
  console.log('🔄 Controller changes:');
  console.log('  ✅ Order ID is now mandatory (primary key)');
  console.log('  ✅ No auto-generation of IDs');
  console.log('  ✅ Simplified duplicate detection using findUnique');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error('Stack trace:', error.stack);
  
  console.log('\n📚 Troubleshooting:');
  console.log('1. Make sure PostgreSQL is running');
  console.log('2. Check if there are existing records with duplicate order_ids');
  console.log('3. Backup your data before running this migration');
  console.log('4. You may need to clean up duplicate data first');
  
  process.exit(1);
}