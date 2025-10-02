/**
 * Customer Similarity Matcher
 * Handles customer name matching for censored names from TikTok Shop
 * Deals with names like "friliawindy" vs "f***iaawindy"
 */

export interface CustomerMatch {
  originalName: string;
  censoredName: string;
  similarity: number;
  isMatch: boolean;
  reason: string;
}

export interface CustomerMatchResult {
  matches: CustomerMatch[];
  suggestions: CustomerMatch[];
  noMatches: string[];
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
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
function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 100;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return ((maxLength - distance) / maxLength) * 100;
}

/**
 * Check if censored name matches pattern with original name
 */
function matchesCensorPattern(original: string, censored: string): { isMatch: boolean; confidence: number; reason: string } {
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
export function findSimilarCustomers(
  censoredName: string, 
  existingCustomers: string[], 
  options: {
    minSimilarity?: number;
    strictMode?: boolean;
    maxResults?: number;
  } = {}
): CustomerMatchResult {
  const {
    minSimilarity = 70,
    strictMode = false,
    maxResults = 5
  } = options;
  
  const matches: CustomerMatch[] = [];
  const suggestions: CustomerMatch[] = [];
  const noMatches: string[] = [];
  
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
    
    const customerMatch: CustomerMatch = {
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
export function getBestCustomerMatch(
  censoredName: string, 
  existingCustomers: string[],
  options: {
    minConfidence?: number;
    strictMode?: boolean;
  } = {}
): { bestMatch: string | null; confidence: number; reason: string } {
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
 * Process customer list for import with similarity matching
 */
export function processCustomerListForImport(
  newCustomers: string[],
  existingCustomers: string[],
  options: {
    minConfidence?: number;
    autoMerge?: boolean;
    logMatches?: boolean;
  } = {}
): {
  processedCustomers: { original: string; mapped: string; confidence: number; reason: string }[];
  stats: {
    total: number;
    matched: number;
    newCustomers: number;
    autoMerged: number;
  };
} {
  const { minConfidence = 75, autoMerge = true, logMatches = true } = options;
  
  const processedCustomers: { original: string; mapped: string; confidence: number; reason: string }[] = [];
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
      minConfidence,
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
  
  return {
    processedCustomers,
    stats: {
      total: newCustomers.length,
      matched: matchedCount,
      newCustomers: newCustomers.length - matchedCount,
      autoMerged: autoMergedCount
    }
  };
}

/**
 * Test function for debugging similarity matching
 */
export function testCustomerMatching() {
  console.log('🧪 Testing Customer Similarity Matching...');
  
  const testCases = [
    { original: 'friliawindy', censored: 'f***iaawindy' },
    { original: 'johndoe123', censored: 'j***doe123' },
    { original: 'mariaangel', censored: 'm***angel' },
    { original: 'budisantoso', censored: 'b***santoso' },
    { original: 'sitinuraini', censored: 's***nuraini' },
    { original: 'ahmadrifai', censored: 'a***rifai' },
  ];
  
  const existingCustomers = testCases.map(tc => tc.original);
  
  testCases.forEach(testCase => {
    const result = getBestCustomerMatch(testCase.censored, existingCustomers);
    console.log(`Test: "${testCase.censored}" → "${result.bestMatch}" (${result.confidence}%)`);
    console.log(`Expected: "${testCase.original}", Reason: ${result.reason}\n`);
  });
}

export const customerSimilarityMatcher = {
  findSimilarCustomers,
  getBestCustomerMatch,
  processCustomerListForImport,
  testCustomerMatching
};