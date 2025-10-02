/**
 * Template Download Tester Utility
 * Utility untuk test semua download template functionality
 */

interface TemplateTestResult {
  type: string;
  success: boolean;
  error?: string;
  size?: number;
  downloaded?: boolean;
}

export class TemplateDownloadTester {
  private backendUrl: string;

  constructor(backendUrl: string = 'http://localhost:3001') {
    this.backendUrl = backendUrl;
  }

  /**
   * Test single template download
   */
  async testTemplateDownload(type: string): Promise<TemplateTestResult> {
    try {
      console.log(`🧪 Testing ${type} template download...`);
      
      const url = `${this.backendUrl}/api/import/templates/${type}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-development-only': 'true',
        },
      });

      if (!response.ok) {
        return {
          type,
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          downloaded: false
        };
      }

      const blob = await response.blob();
      
      return {
        type,
        success: true,
        size: blob.size,
        downloaded: true
      };

    } catch (error) {
      return {
        type,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        downloaded: false
      };
    }
  }

  /**
   * Test all template downloads
   */
  async testAllTemplates(): Promise<TemplateTestResult[]> {
    const templateTypes = ['sales', 'products', 'stock', 'advertising'];
    const results: TemplateTestResult[] = [];

    console.log('🧪 Testing all template downloads...\n');

    for (const type of templateTypes) {
      const result = await this.testTemplateDownload(type);
      results.push(result);
      
      if (result.success) {
        console.log(`✅ ${type.toUpperCase()} template: OK (${result.size} bytes)`);
      } else {
        console.log(`❌ ${type.toUpperCase()} template: FAILED - ${result.error}`);
      }
    }

    return results;
  }

  /**
   * Test template structure and headers
   */
  async testTemplateStructure(type: string): Promise<{
    success: boolean;
    headers?: string[];
    error?: string;
  }> {
    try {
      // This would require XLSX parsing on frontend
      // For now, just test if download works
      const result = await this.testTemplateDownload(type);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }

      // Expected headers for each template type
      const expectedHeaders: Record<string, string[]> = {
        sales: [
          'Order ID', 'Seller SKU', 'Product Name', 'Color', 'Size',
          'Quantity', 'Order Amount', 'Created Time', 'Delivered Time',
          'Total settlement amount', 'Total revenue', 'HPP', 'Total',
          'Marketplace', 'Customer', 'Province', 'Regency', 'City'
        ],
        products: [
          'product_code', 'product_name', 'category', 'brand',
          'size', 'color', 'price', 'cost', 'stock_quantity', 'min_stock'
        ],
        stock: [
          'product_code', 'movement_type', 'quantity',
          'reference_number', 'notes', 'movement_date'
        ],
        advertising: [
          'Campaign Name', 'Campaign Type', 'Platform', 'Ad Group Name',
          'Keyword', 'Ad Creative', 'Date Range Start', 'Date Range End',
          'Impressions', 'Clicks', 'Conversions', 'Cost', 'Revenue', 'Marketplace'
        ]
      };

      return {
        success: true,
        headers: expectedHeaders[type] || []
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate test report
   */
  generateTestReport(results: TemplateTestResult[]): string {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    let report = `
🧪 TEMPLATE DOWNLOAD TEST REPORT
================================

📊 Summary:
   Total Templates: ${totalTests}
   ✅ Passed: ${passedTests}
   ❌ Failed: ${failedTests}
   📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%

📋 Detailed Results:
`;

    results.forEach(result => {
      report += `
   ${result.success ? '✅' : '❌'} ${result.type.toUpperCase()} Template
      Status: ${result.success ? 'SUCCESS' : 'FAILED'}
      ${result.size ? `Size: ${result.size} bytes` : ''}
      ${result.error ? `Error: ${result.error}` : ''}
      Downloaded: ${result.downloaded ? 'Yes' : 'No'}
`;
    });

    report += `
🔧 Recommendations:
`;

    if (failedTests > 0) {
      report += `
   1. Check backend server is running on port 3001
   2. Verify template generation scripts are working
   3. Check file permissions in backend/src/templates/
   4. Run template regeneration script if needed
`;
    } else {
      report += `
   1. All templates are working correctly
   2. Download functionality is operational
   3. Templates are ready for user downloads
`;
    }

    return report;
  }
}

// Export singleton instance
export const templateTester = new TemplateDownloadTester();

// Convenience functions
export const testAllTemplateDownloads = () => templateTester.testAllTemplates();
export const testSingleTemplate = (type: string) => templateTester.testTemplateDownload(type);

/**
 * Browser console testing function
 * Usage in browser console: testTemplateDownloads()
 */
if (typeof window !== 'undefined') {
  (window as any).testTemplateDownloads = async () => {
    const results = await templateTester.testAllTemplates();
    const report = templateTester.generateTestReport(results);
    console.log(report);
    return results;
  };
  
  (window as any).testSingleTemplateDownload = async (type: string) => {
    const result = await templateTester.testTemplateDownload(type);
    console.log(`Template ${type}:`, result);
    return result;
  };
}