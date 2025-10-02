/**
 * Install dotenv dependency for environment configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function installDotenv() {
  console.log('🔧 Installing dotenv dependency...');
  
  try {
    // Check if dotenv is already installed
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.dependencies?.dotenv || packageJson.devDependencies?.dotenv) {
      console.log('✅ dotenv is already installed');
      return true;
    }
    
    // Install dotenv
    console.log('📦 Installing dotenv...');
    execSync('npm install dotenv', { 
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'inherit' 
    });
    
    console.log('✅ dotenv installed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to install dotenv:', error.message);
    console.log('\n💡 Manual installation:');
    console.log('cd backend && npm install dotenv');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  installDotenv();
}

module.exports = { installDotenv };