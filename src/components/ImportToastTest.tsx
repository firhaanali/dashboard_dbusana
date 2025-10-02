import React from 'react';
import { 
  showAdvertisingImportSuccess,
  showAffiliateSamplesImportSuccess,
  showCommissionAdjustmentsImportSuccess,
  showReimbursementsImportSuccess,
  showReturnsImportSuccess 
} from './EnhancedImportToast';

/**
 * Test component untuk memastikan semua import functions tersedia
 * This component is used for testing import functionality
 */
export function ImportToastTest() {
  const testImportData = {
    type: 'sales' as const,
    imported: 100,
    total: 100,
    errors: 0,
    duplicates: 0,
    fileName: 'test-import.xlsx',
    processingTime: 1500
  };

  const handleTestAdvertising = () => {
    showAdvertisingImportSuccess(testImportData);
    console.log('✅ Advertising import success function works');
  };

  const handleTestAffiliate = () => {
    showAffiliateSamplesImportSuccess(testImportData);
    console.log('✅ Affiliate samples import success function works');
  };

  const handleTestCommission = () => {
    showCommissionAdjustmentsImportSuccess(testImportData);
    console.log('✅ Commission adjustments import success function works');
  };

  const handleTestReimbursement = () => {
    showReimbursementsImportSuccess(testImportData);
    console.log('✅ Reimbursements import success function works');
  };

  const handleTestReturns = () => {
    showReturnsImportSuccess(testImportData);
    console.log('✅ Returns import success function works');
  };

  return (
    <div className="p-4 space-y-2">
      <h3 className="text-lg font-semibold">Import Toast Test</h3>
      <div className="space-y-2">
        <button onClick={handleTestAdvertising} className="px-3 py-1 bg-blue-500 text-white rounded">
          Test Advertising Import
        </button>
        <button onClick={handleTestAffiliate} className="px-3 py-1 bg-green-500 text-white rounded">
          Test Affiliate Import
        </button>
        <button onClick={handleTestCommission} className="px-3 py-1 bg-purple-500 text-white rounded">
          Test Commission Import
        </button>
        <button onClick={handleTestReimbursement} className="px-3 py-1 bg-orange-500 text-white rounded">
          Test Reimbursement Import
        </button>
        <button onClick={handleTestReturns} className="px-3 py-1 bg-red-500 text-white rounded">
          Test Returns Import
        </button>
      </div>
    </div>
  );
}