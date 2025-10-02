/**
 * Deep equality comparison utility
 * Replacement for lodash.isequal using native Node.js util.isDeepStrictEqual
 */

const { isDeepStrictEqual } = require('node:util');

/**
 * Deep comparison function that matches lodash.isEqual behavior
 * @param {any} a - First value to compare
 * @param {any} b - Second value to compare
 * @returns {boolean} True if values are deeply equal
 */
function isEqual(a, b) {
  try {
    return isDeepStrictEqual(a, b);
  } catch (error) {
    // Fallback for cases where isDeepStrictEqual might throw
    return JSON.stringify(a) === JSON.stringify(b);
  }
}

/**
 * Shallow comparison for objects
 * @param {Object} a - First object to compare
 * @param {Object} b - Second object to compare
 * @returns {boolean} True if objects are shallowly equal
 */
function isShallowEqual(a, b) {
  if (a === b) return true;
  
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (let key of keysA) {
    if (!keysB.includes(key) || a[key] !== b[key]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Array comparison utility
 * @param {Array} a - First array to compare
 * @param {Array} b - Second array to compare
 * @returns {boolean} True if arrays are deeply equal
 */
function isArrayEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  
  return a.every((item, index) => isEqual(item, b[index]));
}

/**
 * Compare specific properties of objects
 * @param {Object} a - First object
 * @param {Object} b - Second object
 * @param {Array<string>} properties - Properties to compare
 * @returns {boolean} True if specified properties are equal
 */
function isEqualBy(a, b, properties) {
  if (!a || !b) return a === b;
  
  return properties.every(prop => isEqual(a[prop], b[prop]));
}

/**
 * Compare objects ignoring specific properties
 * @param {Object} a - First object
 * @param {Object} b - Second object
 * @param {Array<string>} ignoreProps - Properties to ignore
 * @returns {boolean} True if objects are equal ignoring specified properties
 */
function isEqualExcept(a, b, ignoreProps = []) {
  if (!a || !b) return a === b;
  
  const filterObject = (obj) => {
    const filtered = { ...obj };
    ignoreProps.forEach(prop => delete filtered[prop]);
    return filtered;
  };
  
  return isEqual(filterObject(a), filterObject(b));
}

module.exports = {
  isEqual,
  isShallowEqual,
  isArrayEqual,
  isEqualBy,
  isEqualExcept,
  
  // Aliases for compatibility
  isDeepEqual: isEqual,
  deepEqual: isEqual,
  
  // Export native function for direct use
  isDeepStrictEqual
};