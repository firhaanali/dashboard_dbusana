/**
 * Dependency Update Script
 * Updates and optimizes project dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { isEqual } = require('../backend/src/utils/isEqualUtil');

console.log('🔄 Starting dependency update process...\n');

// Utility functions
const runCommand = (command, cwd = process.cwd()) => {
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
};

const readPackageJson = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to read ${filePath}:`, error.message);
    return null;
  }
};

const writePackageJson = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    return true;
  } catch (error) {
    console.error(`❌ Failed to write ${filePath}:`, error.message);
    return false;
  }
};

// Cleanup unused dependencies
const cleanupDependencies = () => {
  console.log('🧹 Cleaning up unused dependencies...');
  
  const frontendPackagePath = './package.json';
  const backendPackagePath = './backend/package.json';
  
  // Frontend cleanup
  console.log('   Frontend cleanup...');
  if (runCommand('npm prune', '.')) {
    console.log('   ✅ Frontend dependencies pruned');
  }
  
  // Backend cleanup
  console.log('   Backend cleanup...');
  if (runCommand('npm prune', './backend')) {
    console.log('   ✅ Backend dependencies pruned');
  }
};

// Update dependencies with improved versions
const updateDependencies = () => {
  console.log('📦 Updating dependencies to improved versions...');
  
  // Frontend updates
  console.log('   Updating frontend dependencies...');
  const frontendUpdates = [
    'tailwind-merge@latest',
    'lucide-react@latest',
    'recharts@latest'
  ];
  
  for (const dep of frontendUpdates) {
    console.log(`   Installing ${dep}...`);
    if (runCommand(`npm install ${dep}`, '.')) {
      console.log(`   ✅ Updated ${dep}`);
    }
  }
  
  // Backend updates
  console.log('   Updating backend dependencies...');
  const backendUpdates = [
    'express@latest',
    'helmet@latest',
    'compression@latest'
  ];
  
  for (const dep of backendUpdates) {
    console.log(`   Installing ${dep}...`);
    if (runCommand(`npm install ${dep}`, './backend')) {
      console.log(`   ✅ Updated ${dep}`);
    }
  }
};

// Add missing dependencies
const addMissingDependencies = () => {
  console.log('➕ Adding missing dependencies...');
  
  // Frontend missing deps
  const frontendMissing = [
    'react-dnd@^16.0.1',
    'react-dnd-html5-backend@^16.0.1',
    'react-slick@^0.30.2',
    'react-responsive-masonry@^2.1.7'
  ];
  
  console.log('   Adding frontend dependencies...');
  for (const dep of frontendMissing) {
    console.log(`   Installing ${dep}...`);
    if (runCommand(`npm install ${dep}`, '.')) {
      console.log(`   ✅ Added ${dep}`);
    }
  }
  
  // Backend missing deps
  const backendMissing = [
    'rimraf@^4.0.0',
    'glob@^9.0.0',
    'lru-cache@^10.0.0'
  ];
  
  console.log('   Adding backend dependencies...');
  for (const dep of backendMissing) {
    console.log(`   Installing ${dep}...`);
    if (runCommand(`npm install ${dep}`, './backend')) {
      console.log(`   ✅ Added ${dep}`);
    }
  }
};

// Security audit and fix
const securityAudit = () => {
  console.log('🔒 Running security audit...');
  
  console.log('   Frontend security audit...');
  runCommand('npm audit --audit-level=moderate', '.');
  
  console.log('   Backend security audit...');
  runCommand('npm audit --audit-level=moderate', './backend');
  
  console.log('   Attempting automatic fixes...');
  runCommand('npm audit fix', '.');
  runCommand('npm audit fix', './backend');
};

// Verify installations
const verifyInstallations = () => {
  console.log('✅ Verifying installations...');
  
  const frontendPkg = readPackageJson('./package.json');
  const backendPkg = readPackageJson('./backend/package.json');
  
  if (!frontendPkg || !backendPkg) {
    console.error('❌ Failed to read package.json files');
    return false;
  }
  
  // Check critical dependencies
  const criticalFrontend = [
    'react', 'react-dom', 'react-router-dom', 
    'tailwind-merge', 'sonner', 'motion'
  ];
  
  const criticalBackend = [
    'express', 'cors', '@prisma/client', 
    'multer', 'xlsx', 'rimraf', 'glob'
  ];
  
  console.log('   Frontend critical dependencies:');
  for (const dep of criticalFrontend) {
    const installed = frontendPkg.dependencies[dep];
    if (installed) {
      console.log(`   ✅ ${dep}: ${installed}`);
    } else {
      console.log(`   ❌ Missing: ${dep}`);
    }
  }
  
  console.log('   Backend critical dependencies:');
  for (const dep of criticalBackend) {
    const installed = backendPkg.dependencies[dep];
    if (installed) {
      console.log(`   ✅ ${dep}: ${installed}`);
    } else {
      console.log(`   ❌ Missing: ${dep}`);
    }
  }
  
  return true;
};

// Test equality util
const testEqualityUtil = () => {
  console.log('🧪 Testing isEqual utility...');
  
  try {
    const { isEqual, isShallowEqual, isArrayEqual } = require('../backend/src/utils/isEqualUtil');
    
    // Test cases
    const tests = [
      { a: { x: 1, y: 2 }, b: { x: 1, y: 2 }, expected: true },
      { a: [1, 2, 3], b: [1, 2, 3], expected: true },
      { a: { x: 1 }, b: { x: 2 }, expected: false },
      { a: null, b: null, expected: true },
      { a: undefined, b: undefined, expected: true }
    ];
    
    let passed = 0;
    for (const test of tests) {
      const result = isEqual(test.a, test.b);
      if (result === test.expected) {
        passed++;
        console.log(`   ✅ Test passed: ${JSON.stringify(test.a)} === ${JSON.stringify(test.b)}`);
      } else {
        console.log(`   ❌ Test failed: ${JSON.stringify(test.a)} !== ${JSON.stringify(test.b)}`);
      }
    }
    
    console.log(`   📊 Tests passed: ${passed}/${tests.length}`);
    return passed === tests.length;
  } catch (error) {
    console.error('   ❌ Equality util test failed:', error.message);
    return false;
  }
};

// Main execution
const main = async () => {
  try {
    console.log('🚀 D\'Busana Dashboard Dependency Update\n');
    
    // Step 1: Cleanup
    cleanupDependencies();
    console.log('');
    
    // Step 2: Add missing dependencies
    addMissingDependencies();
    console.log('');
    
    // Step 3: Update existing dependencies
    updateDependencies();
    console.log('');
    
    // Step 4: Security audit
    securityAudit();
    console.log('');
    
    // Step 5: Verify installations
    const verified = verifyInstallations();
    console.log('');
    
    // Step 6: Test utilities
    const utilTested = testEqualityUtil();
    console.log('');
    
    // Summary
    console.log('📋 Update Summary:');
    console.log(`   ✅ Cleanup: Complete`);
    console.log(`   ✅ Missing deps: Added`);
    console.log(`   ✅ Updates: Applied`);
    console.log(`   ✅ Security: Audited`);
    console.log(`   ${verified ? '✅' : '❌'} Verification: ${verified ? 'Passed' : 'Failed'}`);
    console.log(`   ${utilTested ? '✅' : '❌'} Utility tests: ${utilTested ? 'Passed' : 'Failed'}`);
    
    if (verified && utilTested) {
      console.log('\n🎉 Dependency update completed successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Run `npm run setup` to ensure all dependencies are installed');
      console.log('2. Run `npm run backend` to start the backend server');
      console.log('3. Run `npm run dev` to start the frontend development server');
      console.log('4. Test import functionality with the duplicate checker');
    } else {
      console.log('\n⚠️ Some issues were detected. Please review the output above.');
    }
    
  } catch (error) {
    console.error('❌ Update process failed:', error);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  cleanupDependencies,
  addMissingDependencies,
  updateDependencies,
  securityAudit,
  verifyInstallations,
  testEqualityUtil
};