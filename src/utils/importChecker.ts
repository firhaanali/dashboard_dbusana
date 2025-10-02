/**
 * Import Checker Utility
 * Helps verify that all import statements are working correctly
 */

// Import all the functions that were causing build errors
import { 
  showAdvertisingImportSuccess,
  showAffiliateSamplesImportSuccess,
  showCommissionAdjustmentsImportSuccess,
  showReimbursementsImportSuccess,
  showReturnsImportSuccess,
  EnhancedImportToast,
  enhancedImportNotifications
} from '../components/EnhancedImportToast';

// Import other critical utilities
import { productsApi } from './productsApiUtils';
import { useProductsAPI } from '../hooks/useProductsAPI';

// Import UI components that had issues
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export interface ImportCheckerResult {
  success: boolean;
  message: string;
  details?: any;
}

class ImportChecker {
  /**
   * Check if all import functions are available
   */
  static checkImportFunctions(): ImportCheckerResult {
    try {
      // Test if all functions exist
      const functions = [
        showAdvertisingImportSuccess,
        showAffiliateSamplesImportSuccess,
        showCommissionAdjustmentsImportSuccess,
        showReimbursementsImportSuccess,
        showReturnsImportSuccess
      ];

      for (const func of functions) {
        if (typeof func !== 'function') {
          return {
            success: false,
            message: `Import function ${func.name} is not available`,
          };
        }
      }

      return {
        success: true,
        message: 'All import functions are available',
        details: {
          functionsChecked: functions.length,
          componentAvailable: typeof EnhancedImportToast === 'function',
          notificationsAvailable: typeof enhancedImportNotifications === 'object'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Import function check failed: ${error}`,
      };
    }
  }

  /**
   * Check if UI components are working
   */
  static checkUIComponents(): ImportCheckerResult {
    try {
      // Test if UI components exist
      const components = [Card, CardHeader, CardTitle, CardContent];
      
      for (const Component of components) {
        if (typeof Component !== 'function') {
          return {
            success: false,
            message: `UI Component ${Component.name} is not available`,
          };
        }
      }

      return {
        success: true,
        message: 'All UI components are available',
        details: {
          componentsChecked: components.length
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `UI component check failed: ${error}`,
      };
    }
  }

  /**
   * Check if API utilities are working
   */
  static async checkApiUtils(): Promise<ImportCheckerResult> {
    try {
      // Test Products API
      const isHealthy = await productsApi.checkHealth();
      
      return {
        success: true,
        message: 'API utilities are available',
        details: {
          productsApiHealthy: isHealthy,
          productsApiAvailable: typeof productsApi === 'object',
          hookAvailable: typeof useProductsAPI === 'function'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `API utilities check failed: ${error}`,
      };
    }
  }

  /**
   * Run comprehensive import check
   */
  static async runFullCheck(): Promise<{
    importFunctions: ImportCheckerResult;
    uiComponents: ImportCheckerResult;
    apiUtils: ImportCheckerResult;
    overall: ImportCheckerResult;
  }> {
    const importFunctions = this.checkImportFunctions();
    const uiComponents = this.checkUIComponents();
    const apiUtils = await this.checkApiUtils();

    const overall: ImportCheckerResult = {
      success: importFunctions.success && uiComponents.success && apiUtils.success,
      message: importFunctions.success && uiComponents.success && apiUtils.success 
        ? 'All imports are working correctly'
        : 'Some imports have issues',
      details: {
        importFunctionsOK: importFunctions.success,
        uiComponentsOK: uiComponents.success,
        apiUtilsOK: apiUtils.success
      }
    };

    return {
      importFunctions,
      uiComponents,
      apiUtils,
      overall
    };
  }

  /**
   * Test import functions with sample data
   */
  static testImportFunctions(): ImportCheckerResult {
    try {
      const testData = {
        type: 'sales' as const,
        imported: 50,
        total: 50,
        errors: 0,
        duplicates: 0,
        fileName: 'test.xlsx',
        processingTime: 1000
      };

      // Test each function
      showAdvertisingImportSuccess(testData);
      showAffiliateSamplesImportSuccess(testData);
      showCommissionAdjustmentsImportSuccess(testData);
      showReimbursementsImportSuccess(testData);
      showReturnsImportSuccess(testData);

      return {
        success: true,
        message: 'All import functions executed successfully',
        details: { testData }
      };
    } catch (error) {
      return {
        success: false,
        message: `Import function test failed: ${error}`,
      };
    }
  }
}

export { ImportChecker };

// Console logging for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.addEventListener('load', async () => {
    console.log('🔍 Running Import Checker...');
    
    const results = await ImportChecker.runFullCheck();
    
    if (results.overall.success) {
      console.log('✅ All imports are working correctly');
    } else {
      console.warn('⚠️ Some imports have issues:', results);
    }
    
    // Make checker available in console for manual testing
    (window as any).importChecker = ImportChecker;
  });
}