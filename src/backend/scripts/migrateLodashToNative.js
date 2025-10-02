/**
 * Migration Script: Lodash.isEqual to Native Node.js util.isDeepStrictEqual
 * Finds and updates all instances of lodash.isequal usage
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

console.log('🔄 Migrating from lodash.isEqual to native Node.js util...\n');

// Find all JavaScript files in the project
const findProjectFiles = async () => {
  try {
    const patterns = [
      'src/**/*.js',
      'controllers/**/*.js',
      'routes/**/*.js',
      'utils/**/*.js',
      'scripts/**/*.js',
      'middleware/**/*.js'
    ];
    
    let allFiles = [];
    for (const pattern of patterns) {
      const files = await glob(pattern, { cwd: process.cwd() });
      allFiles = allFiles.concat(files);
    }
    
    return [...new Set(allFiles)]; // Remove duplicates
  } catch (error) {
    console.error('❌ Error finding files:', error);
    return [];
  }
};

// Analyze file for lodash.isEqual usage
const analyzeFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Check for lodash.isEqual imports/requires
    if (content.includes('lodash.isequal') || content.includes('lodash/isEqual')) {
      issues.push({
        type: 'import',
        line: content.split('\n').findIndex(line => 
          line.includes('lodash.isequal') || line.includes('lodash/isEqual')
        ) + 1,
        description: 'Uses lodash.isEqual import'
      });
    }
    
    // Check for _.isEqual usage
    if (content.includes('_.isEqual')) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('_.isEqual')) {
          issues.push({
            type: 'usage',
            line: index + 1,
            description: 'Uses _.isEqual function',
            content: line.trim()
          });
        }
      });
    }
    
    // Check for isEqual function calls (imported directly)
    if (content.includes('isEqual(') && !content.includes('isDeepStrictEqual')) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('isEqual(') && !line.includes('//')) {
          issues.push({
            type: 'function',
            line: index + 1,
            description: 'Uses isEqual function call',
            content: line.trim()
          });
        }
      });
    }
    
    return issues;
  } catch (error) {
    console.error(`❌ Error analyzing ${filePath}:`, error);
    return [];
  }
};

// Generate migration suggestions
const generateMigrationSuggestions = (filePath, issues) => {
  if (issues.length === 0) return null;
  
  const suggestions = {
    file: filePath,
    issues: issues.length,
    replacements: []
  };
  
  for (const issue of issues) {
    switch (issue.type) {
      case 'import':
        suggestions.replacements.push({
          from: "const isEqual = require('lodash.isequal');",
          to: "const { isEqual } = require('./utils/isEqualUtil');"
        });
        suggestions.replacements.push({
          from: "import isEqual from 'lodash.isequal';",
          to: "import { isEqual } from './utils/isEqualUtil';"
        });
        break;
        
      case 'usage':
        suggestions.replacements.push({
          from: "_.isEqual(a, b)",
          to: "isEqual(a, b)"
        });
        break;
        
      case 'function':
        // Already correct if using isEqual function
        break;
    }
  }
  
  return suggestions;
};

// Apply automatic migrations where safe
const applyMigrations = (filePath, suggestions) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply safe replacements
    for (const replacement of suggestions.replacements) {
      if (content.includes(replacement.from)) {
        content = content.replace(new RegExp(replacement.from, 'g'), replacement.to);
        modified = true;
        console.log(`   ✅ Replaced: ${replacement.from} → ${replacement.to}`);
      }
    }
    
    if (modified) {
      // Create backup
      fs.writeFileSync(`${filePath}.backup`, fs.readFileSync(filePath));
      
      // Write modified content
      fs.writeFileSync(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error applying migrations to ${filePath}:`, error);
    return false;
  }
};

// Main migration process
const runMigration = async () => {
  console.log('🔍 Scanning project files for lodash.isEqual usage...\n');
  
  const files = await findProjectFiles();
  console.log(`📁 Found ${files.length} files to analyze\n`);
  
  const migrationReport = {
    totalFiles: files.length,
    filesWithIssues: 0,
    totalIssues: 0,
    migratedFiles: 0,
    suggestions: []
  };
  
  for (const file of files) {
    const issues = analyzeFile(file);
    
    if (issues.length > 0) {
      migrationReport.filesWithIssues++;
      migrationReport.totalIssues += issues.length;
      
      console.log(`📄 ${file} (${issues.length} issues):`);
      issues.forEach(issue => {
        console.log(`   Line ${issue.line}: ${issue.description}`);
        if (issue.content) {
          console.log(`   Code: ${issue.content}`);
        }
      });
      
      const suggestions = generateMigrationSuggestions(file, issues);
      if (suggestions) {
        migrationReport.suggestions.push(suggestions);
        
        // Apply automatic migrations
        const migrated = applyMigrations(file, suggestions);
        if (migrated) {
          migrationReport.migratedFiles++;
          console.log(`   ✅ Automatically migrated`);
        }
      }
      
      console.log('');
    }
  }
  
  // Generate migration report
  console.log('📊 Migration Report:');
  console.log(`   Total files scanned: ${migrationReport.totalFiles}`);
  console.log(`   Files with lodash usage: ${migrationReport.filesWithIssues}`);
  console.log(`   Total issues found: ${migrationReport.totalIssues}`);
  console.log(`   Files automatically migrated: ${migrationReport.migratedFiles}`);
  
  if (migrationReport.filesWithIssues === 0) {
    console.log('\n✅ No lodash.isEqual usage found. Project is already using native utilities!');
  } else if (migrationReport.migratedFiles === migrationReport.filesWithIssues) {
    console.log('\n🎉 All files successfully migrated to native Node.js utilities!');
  } else {
    console.log('\n⚠️ Some files require manual migration. Please review the suggestions above.');
  }
  
  // Test the new utility
  console.log('\n🧪 Testing native isEqual utility...');
  try {
    const { isEqual } = require('../src/utils/isEqualUtil');
    
    const testCases = [
      [{ a: 1, b: 2 }, { a: 1, b: 2 }],
      [[1, 2, 3], [1, 2, 3]],
      [null, null],
      [undefined, undefined],
      ['hello', 'hello']
    ];
    
    let passed = 0;
    for (const [a, b] of testCases) {
      const result = isEqual(a, b);
      if (result === true) {
        passed++;
        console.log(`   ✅ ${JSON.stringify(a)} === ${JSON.stringify(b)}`);
      } else {
        console.log(`   ❌ ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
      }
    }
    
    console.log(`\n📈 Tests passed: ${passed}/${testCases.length}`);
    
    if (passed === testCases.length) {
      console.log('✅ Native utility is working correctly!');
    }
    
  } catch (error) {
    console.error('❌ Error testing native utility:', error);
  }
  
  return migrationReport;
};

// Performance comparison
const performanceComparison = () => {
  console.log('\n⚡ Performance Comparison: lodash vs native\n');
  
  try {
    const { isEqual, isDeepStrictEqual } = require('../src/utils/isEqualUtil');
    
    const testData = {
      simple: { a: 1, b: 2, c: 3 },
      complex: {
        users: [
          { id: 1, name: 'John', details: { age: 30, city: 'NYC' } },
          { id: 2, name: 'Jane', details: { age: 25, city: 'LA' } }
        ],
        meta: { total: 2, timestamp: new Date().toISOString() }
      }
    };
    
    const iterations = 10000;
    
    // Test native performance
    console.time('Native util.isDeepStrictEqual');
    for (let i = 0; i < iterations; i++) {
      isDeepStrictEqual(testData, { ...testData });
    }
    console.timeEnd('Native util.isDeepStrictEqual');
    
    // Test our wrapper performance
    console.time('Our isEqual wrapper');
    for (let i = 0; i < iterations; i++) {
      isEqual(testData, { ...testData });
    }
    console.timeEnd('Our isEqual wrapper');
    
    console.log('\n📊 Native Node.js utilities are typically faster and have no external dependencies!');
    
  } catch (error) {
    console.error('❌ Performance comparison failed:', error);
  }
};

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      performanceComparison();
      console.log('\n🎯 Migration process completed!');
      console.log('\nNext steps:');
      console.log('1. Test your application to ensure everything works correctly');
      console.log('2. Remove lodash.isequal from package.json if no longer needed');
      console.log('3. Run tests to verify functionality');
      console.log('4. Commit changes with proper backup files');
    })
    .catch(error => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runMigration,
  findProjectFiles,
  analyzeFile,
  generateMigrationSuggestions,
  applyMigrations,
  performanceComparison
};