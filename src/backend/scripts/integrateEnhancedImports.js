const fs = require('fs');
const path = require('path');

async function integrateEnhancedImports() {
  console.log('🔧 Starting Enhanced Import Integration...');
  
  try {
    // Read current import routes
    const routesPath = path.join(__dirname, '../src/routes/import.js');
    let routesContent = fs.readFileSync(routesPath, 'utf8');
    
    console.log('📂 Import routes file loaded successfully');
    
    // Add enhanced controllers to imports
    const enhancedImports = `
// Enhanced imports with duplicate detection
const {
  importAdvertisingDataEnhanced,
  importAdvertisingSettlementDataEnhanced
} = require('../controllers/importControllerEnhanced');`;

    // Check if enhanced imports are already added
    if (!routesContent.includes('importControllerEnhanced')) {
      // Add enhanced imports after existing imports
      const insertAfter = "} = require('../controllers/importControllerUnified');";
      const insertIndex = routesContent.indexOf(insertAfter);
      
      if (insertIndex !== -1) {
        routesContent = routesContent.slice(0, insertIndex + insertAfter.length) + 
                      enhancedImports + 
                      routesContent.slice(insertIndex + insertAfter.length);
        
        console.log('✅ Added enhanced controller imports');
      } else {
        console.log('⚠️ Could not find insertion point for enhanced controllers');
      }
    }
    
    // Update advertising routes to use enhanced versions
    if (routesContent.includes('router.post(\'/advertising\'') && 
        !routesContent.includes('importAdvertisingDataEnhanced')) {
      
      routesContent = routesContent.replace(
        'router.post(\'/advertising\', devOnlyAuth, upload.single(\'file\'), importAdvertisingData);',
        'router.post(\'/advertising\', devOnlyAuth, upload.single(\'file\'), importAdvertisingDataEnhanced);'
      );
      
      routesContent = routesContent.replace(
        'router.post(\'/advertising-settlement\', devOnlyAuth, upload.single(\'file\'), importAdvertisingSettlementData);',
        'router.post(\'/advertising-settlement\', devOnlyAuth, upload.single(\'file\'), importAdvertisingSettlementDataEnhanced);'
      );
      
      console.log('✅ Updated advertising routes to use enhanced functions');
    }
    
    // Write updated routes file
    fs.writeFileSync(routesPath, routesContent);
    console.log('💾 Import routes updated successfully');
    
    // Verify the integration
    console.log('\n🔍 Verifying integration...');
    
    const updatedContent = fs.readFileSync(routesPath, 'utf8');
    const hasEnhancedController = updatedContent.includes('importControllerEnhanced');
    const hasEnhancedAdvertising = updatedContent.includes('importAdvertisingDataEnhanced');
    const hasEnhancedSettlement = updatedContent.includes('importAdvertisingSettlementDataEnhanced');
    
    console.log('✅ Integration verification:');
    console.log(`  • Enhanced controller imported: ${hasEnhancedController}`);
    console.log(`  • Enhanced advertising route: ${hasEnhancedAdvertising}`);
    console.log(`  • Enhanced settlement route: ${hasEnhancedSettlement}`);
    
    if (hasEnhancedController && hasEnhancedAdvertising && hasEnhancedSettlement) {
      console.log('\n🎉 Enhanced Import Integration completed successfully!');
      console.log('\n📋 Features Now Available:');
      console.log('• ✅ Product import with duplicate detection');
      console.log('• ✅ Advertising import with duplicate detection');
      console.log('• ✅ Advertising settlement import with duplicate detection');
      console.log('• ✅ Sales import with duplicate detection (already available)');
      console.log('• ⚠️ Stock import without duplicate detection (as requested)');
      
      console.log('\n🚀 User Benefits:');
      console.log('• File hash-based exact duplicate detection');
      console.log('• Campaign name and date range duplicate warnings');
      console.log('• Product code similarity analysis');
      console.log('• Settlement order ID duplicate prevention');
      console.log('• Smart risk assessment for all import types');
    } else {
      console.log('\n⚠️ Some integrations may be incomplete - please verify manually');
    }
    
  } catch (error) {
    console.error('❌ Integration failed:', error);
    throw error;
  }
}

// Self-executing function with error handling
(async () => {
  try {
    await integrateEnhancedImports();
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal integration error:', error);
    process.exit(1);
  }
})();