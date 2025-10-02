/**
 * Simple syntax validation test
 * This file tests that our TypeScript syntax is correct
 */

// Test basic function
export const testFunction = () => {
  return "syntax test passed";
};

// Test async function
export const testAsyncFunction = async () => {
  return Promise.resolve("async syntax test passed");
};

// Test interface
interface TestInterface {
  name: string;
  value: number;
}

// Test function with interface parameter
export const testInterfaceFunction = (data: TestInterface) => {
  return `${data.name}: ${data.value}`;
};

// Test simple export
export default {
  testFunction,
  testAsyncFunction,
  testInterfaceFunction
};