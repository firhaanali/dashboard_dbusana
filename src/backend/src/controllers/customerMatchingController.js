/**
 * Customer Matching Controller
 * Handles customer name similarity matching for censored names from TikTok Shop
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Create matrix
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));
  
  // Initialize first row and column
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Calculate similarity percentage between two strings
 */
function calculateSimilarity(str1, str2) {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 100;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return ((maxLength - distance) / maxLength) * 100;
}

/**
 * Check if censored name matches pattern with original name
 */
function matchesCensorPattern(original, censored) {
  if (!original || !censored) {
    return { isMatch: false, confidence: 0, reason: 'Empty strings' };
  }
  
  const cleanOriginal = original.toLowerCase().trim();
  const cleanCensored = censored.toLowerCase().trim();
  
  // Check if censored contains *** pattern
  if (!cleanCensored.includes('*')) {
    return { isMatch: false, confidence: 0, reason: 'No censorship pattern found' };
  }
  
  // Split censored name by asterisks
  const parts = cleanCensored.split(/\*+/);
  const visibleParts = parts.filter(part => part.length > 0);
  
  if (visibleParts.length === 0) {
    return { isMatch: false, confidence: 0, reason: 'No visible characters in censored name' };
  }
  
  // Check if all visible parts exist in original name in order
  let originalIndex = 0;
  let matchedChars = 0;
  let matchedParts = 0;
  
  for (const part of visibleParts) {
    const foundIndex = cleanOriginal.indexOf(part, originalIndex);
    if (foundIndex !== -1) {
      matchedParts++;
      matchedChars += part.length;
      originalIndex = foundIndex + part.length;
    }
  }
  
  // Calculate confidence based on matched characters and parts
  const charRatio = matchedChars / cleanOriginal.length;
  const partRatio = matchedParts / visibleParts.length;
  
  // High confidence if most characters match and all parts found
  if (partRatio === 1.0 && charRatio >= 0.7) {
    return { 
      isMatch: true, 
      confidence: Math.min(95, charRatio * 100), 
      reason: `All visible parts match with ${Math.round(charRatio * 100)}% character coverage` 
    };
  }
  
  // Medium confidence if most parts match
  if (partRatio >= 0.8 && charRatio >= 0.5) {
    return { 
      isMatch: true, 
      confidence: Math.min(85, (partRatio + charRatio) * 50), 
      reason: `${Math.round(partRatio * 100)}% parts match with ${Math.round(charRatio * 100)}% character coverage` 
    };
  }
  
  // Low confidence but possible match
  if (partRatio >= 0.6 && charRatio >= 0.3) {
    return { 
      isMatch: false, 
      confidence: Math.min(75, (partRatio + charRatio) * 40), 
      reason: `Possible match: ${Math.round(partRatio * 100)}% parts, ${Math.round(charRatio * 100)}% characters` 
    };
  }
  
  return { 
    isMatch: false, 
    confidence: Math.min(50, (partRatio + charRatio) * 30), 
    reason: `Low similarity: ${Math.round(partRatio * 100)}% parts, ${Math.round(charRatio * 100)}% characters` 
  };
}

/**
 * Find similar customer names with different matching strategies
 */
function findSimilarCustomers(censoredName, existingCustomers, options = {}) {
  const {
    minSimilarity = 70,
    strictMode = false,
    maxResults = 5
  } = options;
  
  const matches = [];
  const suggestions = [];
  const noMatches = [];
  
  if (!censoredName || existingCustomers.length === 0) {
    return { matches, suggestions, noMatches: [censoredName] };
  }
  
  for (const existingName of existingCustomers) {
    if (!existingName) continue;
    
    // Strategy 1: Check censor pattern matching
    const censorMatch = matchesCensorPattern(existingName, censoredName);
    
    // Strategy 2: Calculate general similarity
    const generalSimilarity = calculateSimilarity(existingName, censoredName);
    
    // Strategy 3: Check if names are exactly the same (already clean)
    const exactMatch = existingName.toLowerCase().trim() === censoredName.toLowerCase().trim();
    
    let finalSimilarity = Math.max(censorMatch.confidence, generalSimilarity);
    let isMatch = false;
    let reason = '';
    
    if (exactMatch) {
      finalSimilarity = 100;
      isMatch = true;
      reason = 'Exact match';
    } else if (censorMatch.isMatch) {
      finalSimilarity = censorMatch.confidence;
      isMatch = strictMode ? censorMatch.confidence >= minSimilarity : true;
      reason = `Censor pattern: ${censorMatch.reason}`;
    } else if (generalSimilarity >= minSimilarity) {
      finalSimilarity = generalSimilarity;
      isMatch = true;
      reason = `General similarity: ${Math.round(generalSimilarity)}%`;
    } else if (censorMatch.confidence >= minSimilarity * 0.8) {
      finalSimilarity = censorMatch.confidence;
      isMatch = false;
      reason = `Potential censor match: ${censorMatch.reason}`;
    }
    
    const customerMatch = {
      originalName: existingName,
      censoredName,
      similarity: Math.round(finalSimilarity),
      isMatch,
      reason
    };
    
    if (isMatch) {
      matches.push(customerMatch);
    } else if (finalSimilarity >= minSimilarity * 0.6) {
      suggestions.push(customerMatch);
    }
  }
  
  // Sort by similarity
  matches.sort((a, b) => b.similarity - a.similarity);
  suggestions.sort((a, b) => b.similarity - a.similarity);
  
  // Limit results
  const limitedMatches = matches.slice(0, maxResults);
  const limitedSuggestions = suggestions.slice(0, maxResults);
  
  // If no matches found, add to noMatches
  if (limitedMatches.length === 0) {
    noMatches.push(censoredName);
  }
  
  return {
    matches: limitedMatches,
    suggestions: limitedSuggestions,
    noMatches
  };
}

/**
 * Get best customer match for import processing
 */
function getBestCustomerMatch(censoredName, existingCustomers, options = {}) {
  const { minConfidence = 80, strictMode = true } = options;
  
  const result = findSimilarCustomers(censoredName, existingCustomers, {
    minSimilarity: minConfidence,
    strictMode,
    maxResults: 1
  });
  
  if (result.matches.length > 0) {
    const bestMatch = result.matches[0];
    return {
      bestMatch: bestMatch.originalName,
      confidence: bestMatch.similarity,
      reason: bestMatch.reason
    };
  }
  
  // Check suggestions if no strict matches
  if (!strictMode && result.suggestions.length > 0) {
    const bestSuggestion = result.suggestions[0];
    if (bestSuggestion.similarity >= minConfidence * 0.8) {
      return {
        bestMatch: bestSuggestion.originalName,
        confidence: bestSuggestion.similarity,
        reason: `Suggestion: ${bestSuggestion.reason}`
      };
    }
  }
  
  return {
    bestMatch: null,
    confidence: 0,
    reason: 'No suitable match found'
  };
}

/**
 * GET /api/customer-matching/existing
 * Get all existing customer names for matching
 */
const getExistingCustomers = async (req, res) => {
  try {
    console.log('📋 Fetching existing customers for matching...');
    
    // Get unique customer names from sales table
    const customers = await prisma.sales.findMany({
      select: {
        customer: true
      },
      where: {
        customer: {
          not: null
        }
      },
      distinct: ['customer']
    });
    
    const customerNames = customers
      .map(c => c.customer)
      .filter(name => name && name.trim() !== '')
      .sort();
    
    console.log(`✅ Found ${customerNames.length} unique customers`);
    
    res.json({
      success: true,
      customers: customerNames,
      count: customerNames.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching existing customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch existing customers',
      error: error.message
    });
  }
};

/**
 * POST /api/customer-matching/find-matches
 * Find matching customers for a censored name
 */
const findMatches = async (req, res) => {
  try {
    const { censoredName, minSimilarity = 70, maxResults = 10 } = req.body;
    
    if (!censoredName) {
      return res.status(400).json({
        success: false,
        message: 'Censored name is required'
      });
    }
    
    console.log(`🔍 Finding matches for: "${censoredName}"`);
    
    // Get all existing customer names
    const customers = await prisma.sales.findMany({
      select: {
        customer: true
      },
      where: {
        customer: {
          not: null
        }
      },
      distinct: ['customer']
    });
    
    const existingCustomers = customers
      .map(c => c.customer)
      .filter(name => name && name.trim() !== '');
    
    // Find similar customers
    const result = findSimilarCustomers(censoredName, existingCustomers, {
      minSimilarity: parseInt(minSimilarity),
      maxResults: parseInt(maxResults)
    });
    
    console.log(`✅ Found ${result.matches.length} matches, ${result.suggestions.length} suggestions`);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('❌ Error finding matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find matches',
      error: error.message
    });
  }
};

/**
 * POST /api/customer-matching/process-import
 * Process customer list for import with similarity matching
 */
const processImport = async (req, res) => {
  try {
    const { 
      newCustomers, 
      minConfidence = 75, 
      autoMerge = true, 
      logMatches = true 
    } = req.body;
    
    if (!newCustomers || !Array.isArray(newCustomers)) {
      return res.status(400).json({
        success: false,
        message: 'New customers array is required'
      });
    }
    
    console.log(`🔄 Processing ${newCustomers.length} customers for import...`);
    
    // Get all existing customer names
    const existingCustomersData = await prisma.sales.findMany({
      select: {
        customer: true
      },
      where: {
        customer: {
          not: null
        }
      },
      distinct: ['customer']
    });
    
    const existingCustomers = existingCustomersData
      .map(c => c.customer)
      .filter(name => name && name.trim() !== '');
    
    const processedCustomers = [];
    let matchedCount = 0;
    let autoMergedCount = 0;
    
    for (const customerName of newCustomers) {
      if (!customerName || customerName.trim() === '') {
        processedCustomers.push({
          original: customerName,
          mapped: customerName,
          confidence: 100,
          reason: 'Empty/null customer name'
        });
        continue;
      }
      
      const bestMatch = getBestCustomerMatch(customerName, existingCustomers, {
        minConfidence: parseInt(minConfidence),
        strictMode: false
      });
      
      if (bestMatch.bestMatch && autoMerge) {
        processedCustomers.push({
          original: customerName,
          mapped: bestMatch.bestMatch,
          confidence: bestMatch.confidence,
          reason: bestMatch.reason
        });
        matchedCount++;
        
        if (customerName !== bestMatch.bestMatch) {
          autoMergedCount++;
        }
        
        if (logMatches) {
          console.log(`✅ Customer matched: "${customerName}" → "${bestMatch.bestMatch}" (${bestMatch.confidence}% confidence)`);
        }
      } else {
        // Keep original name if no good match found
        processedCustomers.push({
          original: customerName,
          mapped: customerName,
          confidence: 100,
          reason: 'No match found - keeping as new customer'
        });
        
        // Add to existing customers list for future matching
        existingCustomers.push(customerName);
      }
    }
    
    const stats = {
      total: newCustomers.length,
      matched: matchedCount,
      newCustomers: newCustomers.length - matchedCount,
      autoMerged: autoMergedCount
    };
    
    console.log(`✅ Processing complete:`, stats);
    
    res.json({
      success: true,
      processedCustomers,
      stats
    });
    
  } catch (error) {
    console.error('❌ Error processing customer import:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process customer import',
      error: error.message
    });
  }
};

/**
 * GET /api/customer-matching/stats
 * Get customer matching statistics
 */
const getStats = async (req, res) => {
  try {
    console.log('📊 Generating customer matching statistics...');
    
    // Get total unique customers
    const totalCustomers = await prisma.sales.groupBy({
      by: ['customer'],
      where: {
        customer: {
          not: null
        }
      }
    });
    
    // Get customers with potential censorship (containing ***)
    const censoredCustomers = await prisma.sales.groupBy({
      by: ['customer'],
      where: {
        customer: {
          contains: '***'
        }
      }
    });
    
    // Get recent customer activity
    const recentActivity = await prisma.sales.findMany({
      select: {
        customer: true,
        created_time: true
      },
      where: {
        customer: {
          not: null
        },
        created_time: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      orderBy: {
        created_time: 'desc'
      },
      take: 100
    });
    
    const stats = {
      totalUniqueCustomers: totalCustomers.length,
      censoredCustomers: censoredCustomers.length,
      censorshipRate: totalCustomers.length > 0 ? 
        (censoredCustomers.length / totalCustomers.length) * 100 : 0,
      recentActivityCount: recentActivity.length,
      lastProcessed: new Date().toISOString()
    };
    
    console.log('✅ Customer matching stats generated:', stats);
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('❌ Error getting customer matching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get customer matching stats',
      error: error.message
    });
  }
};

/**
 * POST /api/customer-matching/test
 * Test customer matching algorithms
 */
const testMatching = async (req, res) => {
  try {
    console.log('🧪 Running customer matching tests...');
    
    const testCases = [
      { original: 'friliawindy', censored: 'f***iaawindy' },
      { original: 'johndoe123', censored: 'j***doe123' },
      { original: 'mariaangel', censored: 'm***angel' },
      { original: 'budisantoso', censored: 'b***santoso' },
      { original: 'sitinuraini', censored: 's***nuraini' },
      { original: 'ahmadrifai', censored: 'a***rifai' },
    ];
    
    const existingCustomers = testCases.map(tc => tc.original);
    const results = [];
    
    for (const testCase of testCases) {
      const result = getBestCustomerMatch(testCase.censored, existingCustomers);
      results.push({
        testCase,
        result,
        success: result.bestMatch === testCase.original
      });
    }
    
    const successRate = (results.filter(r => r.success).length / results.length) * 100;
    
    console.log(`✅ Test completed with ${successRate}% success rate`);
    
    res.json({
      success: true,
      testResults: results,
      successRate,
      totalTests: results.length
    });
    
  } catch (error) {
    console.error('❌ Error running matching tests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run matching tests',
      error: error.message
    });
  }
};

module.exports = {
  getExistingCustomers,
  findMatches,
  processImport,
  getStats,
  testMatching,
  // Export utility functions for use in other controllers
  findSimilarCustomers,
  getBestCustomerMatch,
  calculateSimilarity,
  matchesCensorPattern
};