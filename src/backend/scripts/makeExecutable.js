#!/usr/bin/env node

/**
 * Make shell scripts executable
 */

const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '../APPLY_DEPENDENCY_UPDATES.sh');

try {
  // Make the shell script executable
  fs.chmodSync(scriptPath, '755');
  console.log('✅ APPLY_DEPENDENCY_UPDATES.sh is now executable');
  console.log('Run with: ./APPLY_DEPENDENCY_UPDATES.sh');
} catch (error) {
  console.log('Note: Run chmod +x APPLY_DEPENDENCY_UPDATES.sh manually if needed');
}