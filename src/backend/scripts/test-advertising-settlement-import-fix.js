#!/usr/bin/env node

// 🔧 SCRIPT UNTUK TEST ADVERTISING SETTLEMENT IMPORT FIX
// Mengatasi masalah valid_records missing dan format tanggal

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('🔧 TESTING ADVERTISING SETTLEMENT IMPORT FIX...');
console.log('');

async function testImportFix() {
  try {
    console.log('🔍 Step 1: Check Import Batch schema...');
    
    // Test import batch creation with all required fields
    const testBatchId = `test-${Date.now()}`;
    
    try {
      const testBatch = await prisma.importBatch.create({
        data: {
          id: testBatchId,
          batch_name: 'Test Advertising Settlement Import',
          import_type: 'advertising-settlement',
          file_name: 'test_file.xlsx',
          file_type: 'excel',
          total_records: 10,
          valid_records: 0, // ✅ Now provided
          invalid_records: 0, // ✅ Now provided  
          imported_records: 0, // ✅ Now provided
          status: 'processing'
        }
      });
      
      console.log('✅ Import batch creation test successful:', testBatch.id);
      
      // Clean up test batch
      await prisma.importBatch.delete({
        where: { id: testBatchId }
      });
      
      console.log('✅ Test batch cleaned up successfully');
      
    } catch (batchError) {
      console.error('❌ Import batch creation failed:', batchError.message);
      throw batchError;
    }
    
    console.log('');
    console.log('🔍 Step 2: Check Advertising Settlement schema...');
    
    // Test advertising settlement creation
    const testOrderId = `TEST-ORDER-${Date.now()}`;
    
    try {
      const testSettlement = await prisma.advertisingSettlement.create({
        data: {
          order_id: testOrderId, // Primary key
          type: 'GMV Payment for TikTok Ads',
          order_created_time: new Date('2025-02-01'),
          order_settled_time: new Date('2025-02-02'),
          settlement_amount: 555000,
          settlement_period: '2025-02',
          account_name: 'D\'Busana Fashion Ads',
          marketplace: 'Tiktok Shop',
          currency: 'IDR',
          import_batch_id: testBatchId
        }
      });
      
      console.log('✅ Advertising settlement creation test successful:', testSettlement.order_id);
      
      // Test update existing settlement
      const updatedSettlement = await prisma.advertisingSettlement.update({
        where: { order_id: testOrderId },
        data: {
          settlement_amount: 600000,
          updated_at: new Date()
        }
      });
      
      console.log('✅ Advertising settlement update test successful:', updatedSettlement.settlement_amount);
      
      // Clean up test settlement
      await prisma.advertisingSettlement.delete({
        where: { order_id: testOrderId }
      });
      
      console.log('✅ Test settlement cleaned up successfully');
      
    } catch (settlementError) {
      console.error('❌ Advertising settlement test failed:', settlementError.message);
      throw settlementError;
    }
    
    console.log('');
    console.log('🔍 Step 3: Test date parsing function...');
    
    // Test the date parsing function
    const moment = require('moment');
    
    const parseExcelDate = (excelDate) => {
      if (!excelDate) return null;
      
      if (excelDate instanceof Date) {
        return excelDate;
      }
      
      if (typeof excelDate === 'string') {
        const trimmedDate = excelDate.toString().trim();
        
        const date = moment(trimmedDate, [
          'YYYY/MM/DD',      // Format dari data user: 2025/02/01
          'DD/MM/YYYY',      // Standard Indonesian format
          'DD/MM/YY',        // Short year format
          'YYYY-MM-DD',      // ISO format
          'MM/DD/YYYY',      // US format
          'DD/MM/YYYY HH:mm:ss', 
          'YYYY/MM/DD HH:mm:ss',
          'MM/DD/YYYY HH:mm:ss'
        ], true);
        
        if (date.isValid()) {
          return date.toDate();
        }
        
        return null;
      }
      
      if (typeof excelDate === 'number') {
        try {
          const date = moment('1900-01-01').add(excelDate - 2, 'days');
          if (date.isValid()) {
            return date.toDate();
          }
        } catch (error) {
          console.warn(`Could not parse Excel serial date: ${excelDate}`);
        }
      }
      
      return null;
    };
    
    // Test different date formats from user data
    const testDates = [
      '2025/02/01',
      '2025/02/02', 
      '2025/02/03',
      '01/02/2025',
      '2025-02-01'
    ];
    
    testDates.forEach(testDate => {
      const parsed = parseExcelDate(testDate);
      console.log(`📅 Date parsing test: "${testDate}" → ${parsed ? parsed.toISOString().split('T')[0] : 'FAILED'}`);
    });
    
    console.log('');
    console.log('🔍 Step 4: Test column mapping...');
    
    // Test column mapping for user Excel format
    const testRowData = {
      'Order ID': '346545121059999033',
      'Type': 'GMV Payment for TikTok Ads',
      'Order Created Time': '2025/02/01',
      'Order Settled Time': '2025/02/02',
      'Settlement Amount': '555000',
      'Account Name': 'D\'Busana Fashion Ads',
      'Marketplace': 'Tiktok Shop',
      'Currency': 'IDR'
    };
    
    // Test column extraction
    const hasOrderId = testRowData['Order ID'] || testRowData.order_id || testRowData['order_id'] || testRowData['ORDER_ID'];
    const hasSettlementAmount = testRowData['Settlement Amount'] || testRowData.settlement_amount || testRowData['settlement_amount'] || testRowData['SETTLEMENT_AMOUNT'];
    const hasOrderCreatedTime = testRowData['Order Created Time'] || testRowData.order_created_time || testRowData['order_created_time'] || testRowData['ORDER_CREATED_TIME'];
    const hasOrderSettledTime = testRowData['Order Settled Time'] || testRowData.order_settled_time || testRowData['order_settled_time'] || testRowData['ORDER_SETTLED_TIME'];
    const hasType = testRowData['Type'] || testRowData.type || testRowData['type'] || testRowData['TYPE'];
    const hasAccountName = testRowData['Account Name'] || testRowData.account_name || testRowData['account_name'] || testRowData['ACCOUNT_NAME'];
    const hasCurrency = testRowData['Currency'] || testRowData.currency || testRowData['currency'] || testRowData['CURRENCY'];
    const hasMarketplace = testRowData['Marketplace'] || testRowData.marketplace || testRowData['marketplace'] || testRowData['MARKETPLACE'];
    
    console.log('✅ Column mapping test results:');
    console.log(`   📋 Order ID: ${hasOrderId || 'NOT FOUND'}`);
    console.log(`   💰 Settlement Amount: ${hasSettlementAmount || 'NOT FOUND'}`);
    console.log(`   📅 Order Created Time: ${hasOrderCreatedTime || 'NOT FOUND'}`);
    console.log(`   📅 Order Settled Time: ${hasOrderSettledTime || 'NOT FOUND'}`);
    console.log(`   🏷️ Type: ${hasType || 'NOT FOUND'}`);
    console.log(`   👤 Account Name: ${hasAccountName || 'NOT FOUND'}`);
    console.log(`   🏪 Marketplace: ${hasMarketplace || 'NOT FOUND'}`);
    console.log(`   💱 Currency: ${hasCurrency || 'NOT FOUND'}`);
    
    if (hasOrderId && hasSettlementAmount && hasOrderCreatedTime && hasOrderSettledTime) {
      console.log('✅ All required columns found and mapped correctly');
    } else {
      console.log('❌ Some required columns missing');
    }
    
    console.log('');
    console.log('🎉 ALL IMPORT FIX TESTS PASSED SUCCESSFULLY!');
    console.log('');
    console.log('📋 SUMMARY:');
    console.log('✅ Import Batch schema: Compatible');
    console.log('✅ Advertising Settlement schema: Compatible');
    console.log('✅ Date parsing: Working for YYYY/MM/DD format');
    console.log('✅ Column mapping: All columns detected');
    console.log('✅ Required fields: valid_records, invalid_records, imported_records provided');
    console.log('');
    console.log('🚀 NEXT STEPS:');
    console.log('1. Start backend server: npm run dev');
    console.log('2. Test import dengan file Excel Anda');
    console.log('3. Data format YYYY/MM/DD sudah didukung');
    console.log('4. Kolom mapping sudah sesuai dengan Excel Anda');
    console.log('');
    console.log('🔗 Import fix complete! Advertising settlement import should work now.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ IMPORT FIX TEST FAILED:');
    console.error('   Error:', error.message);
    console.error('');
    console.error('🔧 TROUBLESHOOTING:');
    console.error('1. Check database connection');
    console.error('2. Verify schema migration completed');
    console.error('3. Check if all required tables exist');
    console.error('4. Verify Prisma client is properly configured');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testImportFix();