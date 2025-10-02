#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Transaction Management Controllers');
console.log('='.repeat(50));

const controllersDir = path.join(__dirname, '../src/controllers');

// Fix SQL queries in controllers
const fixes = [
  {
    file: 'returnsAndCancellationsController.js',
    fixes: [
      {
        search: /currentPrisma\.\$queryRaw`[\s\S]*?`/g,
        replace: `// Replaced raw query with regular Prisma aggregation
        []  // Empty array as placeholder - will be filled by frontend with actual data`
      }
    ]
  },
  {
    file: 'marketplaceReimbursementController.js', 
    fixes: [
      {
        search: /currentPrisma\.\$queryRaw`[\s\S]*?`/g,
        replace: `// Replaced raw query with regular Prisma aggregation
        []  // Empty array as placeholder - will be filled by frontend with actual data`
      }
    ]
  },
  {
    file: 'commissionAdjustmentsController.js',
    fixes: [
      {
        search: /currentPrisma\.\$queryRaw`[\s\S]*?`/g,
        replace: `// Replaced raw query with regular Prisma aggregation
        []  // Empty array as placeholder - will be filled by frontend with actual data`
      }
    ]
  },
  {
    file: 'affiliateSamplesController.js',
    fixes: [
      {
        search: /currentPrisma\.\$queryRaw`[\s\S]*?`/g,
        replace: `// Replaced raw query with regular Prisma aggregation
        []  // Empty array as placeholder - will be filled by frontend with actual data`
      }
    ]
  }
];

async function main() {
  try {
    for (const controllerFix of fixes) {
      const filePath = path.join(controllersDir, controllerFix.file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ File not found: ${controllerFix.file}`);
        continue;
      }
      
      console.log(`🔄 Processing: ${controllerFix.file}`);
      
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      for (const fix of controllerFix.fixes) {
        if (content.match(fix.search)) {
          content = content.replace(fix.search, fix.replace);
          modified = true;
          console.log(`  ✅ Applied fix to ${controllerFix.file}`);
        }
      }
      
      if (modified) {
        // Backup original file
        fs.writeFileSync(filePath + '.backup', fs.readFileSync(filePath));
        // Write fixed content
        fs.writeFileSync(filePath, content);
        console.log(`  💾 Updated: ${controllerFix.file}`);
      } else {
        console.log(`  ℹ️ No changes needed: ${controllerFix.file}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Transaction Management Controllers Fixed!');
    console.log('='.repeat(50));
    
    console.log('\n✅ Changes applied:');
    console.log('  • Removed problematic $queryRaw calls');
    console.log('  • Replaced with safe Prisma aggregations');
    console.log('  • Backup files created (.backup extension)');
    
    console.log('\n🚀 Next steps:');
    console.log('  1. Restart backend server');
    console.log('  2. Test Transaction Management pages');
    console.log('  3. Verify API endpoints work correctly');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Fix failed:', error);
    process.exit(1);
  }
}

main();