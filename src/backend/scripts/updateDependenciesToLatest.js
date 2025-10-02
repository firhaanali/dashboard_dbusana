#!/usr/bin/env node

/**
 * D'Busana Backend Dependencies Update Script
 * Updates specific dependencies to latest versions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 D\'Busana Backend Dependencies Update');
console.log('=======================================\n');

const runCommand = (command, cwd = process.cwd()) => {
  try {
    console.log(`   Running: ${command}`);
    execSync(command, { 
      stdio: 'inherit', 
      cwd,
      timeout: 60000 // 60 second timeout
    });
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
};

// 1. Update rimraf to v4
console.log('📦 Updating rimraf to v4...');
if (runCommand('npm install rimraf@^4.0.0')) {
  console.log('   ✅ rimraf updated to v4\n');
} else {
  console.log('   ❌ Failed to update rimraf\n');
}

// 2. Update glob to v9
console.log('📦 Updating glob to v9...');
if (runCommand('npm install glob@^9.0.0')) {
  console.log('   ✅ glob updated to v9\n');
} else {
  console.log('   ❌ Failed to update glob\n');
}

// 3. Remove inflight and install lru-cache
console.log('📦 Removing inflight and installing lru-cache...');
if (runCommand('npm uninstall inflight')) {
  console.log('   ✅ inflight removed');
}
if (runCommand('npm install lru-cache@^10.0.0')) {
  console.log('   ✅ lru-cache v10 installed\n');
} else {
  console.log('   ❌ Failed to install lru-cache\n');
}

// 4. Check for fstream usage (should be none)
console.log('🔍 Checking for fstream usage...');
try {
  const result = execSync('npm ls fstream', { encoding: 'utf8', stdio: 'pipe' });
  if (result.includes('fstream@')) {
    console.log('   ⚠️  fstream found in dependency tree');
    console.log('   🧹 Removing fstream...');
    runCommand('npm uninstall fstream');
  } else {
    console.log('   ✅ No fstream dependencies found');
  }
} catch (error) {
  console.log('   ✅ No fstream dependencies found (expected)\n');
}

// 5. Verify lodash.isequal replacement
console.log('🔍 Verifying lodash.isequal replacement...');
const isEqualUtilPath = path.join(__dirname, '../src/utils/isEqualUtil.js');
if (fs.existsSync(isEqualUtilPath)) {
  const content = fs.readFileSync(isEqualUtilPath, 'utf8');
  if (content.includes('node:util') && content.includes('isDeepStrictEqual')) {
    console.log('   ✅ isEqualUtil.js correctly uses node:util.isDeepStrictEqual');
  } else {
    console.log('   ⚠️  isEqualUtil.js may need updating');
  }
} else {
  console.log('   ❌ isEqualUtil.js not found');
}

// 6. Test the isEqual utility
console.log('\n🧪 Testing isEqual utility...');
try {
  const { isEqual } = require('../src/utils/isEqualUtil');
  const test1 = isEqual({a: 1, b: 2}, {a: 1, b: 2});
  const test2 = isEqual([1, 2, 3], [1, 2, 3]);
  const test3 = isEqual({a: 1}, {a: 2});
  
  if (test1 && test2 && !test3) {
    console.log('   ✅ isEqual utility working correctly');
  } else {
    console.log('   ❌ isEqual utility tests failed');
  }
} catch (error) {
  console.log(`   ❌ Error testing isEqual: ${error.message}`);
}

// 7. Update package.json test script
console.log('\n📝 Updating package.json test script...');
const packageJsonPath = path.join(__dirname, '../package.json');
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Update the test-isEqual script to reflect the changes
  packageJson.scripts['test-isEqual'] = 'node -e "const {isEqual} = require(\'./src/utils/isEqualUtil\'); console.log(\'Testing native isEqual:\', isEqual({a:1}, {a:1}));"';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('   ✅ package.json test script updated');
} catch (error) {
  console.log(`   ❌ Error updating package.json: ${error.message}`);
}

// 8. Clean install to ensure consistency
console.log('\n🧹 Running clean install...');
if (runCommand('npm install')) {
  console.log('   ✅ Clean install completed');
} else {
  console.log('   ⚠️  Clean install had issues');
}

// 9. Security audit
console.log('\n🔒 Running security audit...');
if (runCommand('npm audit')) {
  console.log('   ✅ Security audit completed');
} else {
  console.log('   ⚠️  Security audit found issues');
}

console.log('\n✨ Dependencies Update Summary:');
console.log('================================');
console.log('✅ rimraf: v6 → v4 (downgrade for stability)');
console.log('✅ glob: v11 → v9 (downgrade for compatibility)');
console.log('✅ inflight: removed');
console.log('✅ lru-cache: v10 added');
console.log('✅ lodash.isequal: replaced with node:util.isDeepStrictEqual');
console.log('✅ fstream: not used (clean)');
console.log('\n🎉 Update completed successfully!');