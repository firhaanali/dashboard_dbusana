const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost', 
  database: process.env.DB_NAME || 'dbusana_dashboard',
  password: process.env.DB_PASSWORD || 'admin123',
  port: process.env.DB_PORT || 5432,
});

async function setupActivityLogs() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up Activity Logs system...');
    
    // Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('📋 Creating activity_logs table...');
      
      // Read and execute migration file
      const migrationPath = path.join(__dirname, '../prisma/migrations/019_add_activity_logs_table.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      await client.query(migrationSQL);
      console.log('✅ Activity logs table created successfully!');
    } else {
      console.log('✅ Activity logs table already exists');
    }
    
    // Add sample activities for testing
    console.log('📝 Adding sample activity logs...');
    
    const sampleActivities = [
      {
        type: 'system',
        title: 'Sistem Dimulai',
        description: 'D\'Busana Dashboard berhasil dimulai dan semua sistem berjalan normal',
        status: 'success',
        metadata: {
          startup_time: new Date().toISOString(),
          version: '1.0.0'
        }
      },
      {
        type: 'import',
        title: 'Import Data Penjualan', 
        description: 'Import data penjualan berhasil - 25 records',
        status: 'success',
        metadata: {
          import_type: 'sales',
          record_count: 25,
          file_name: 'sales_sample.xlsx'
        }
      },
      {
        type: 'import',
        title: 'Import Data Produk',
        description: 'Import data produk berhasil - 15 records', 
        status: 'success',
        metadata: {
          import_type: 'products',
          record_count: 15,
          file_name: 'products_sample.xlsx'
        }
      },
      {
        type: 'sale',
        title: 'Transaksi Penjualan',
        description: 'Penjualan Dress Elegant di Shopee',
        status: 'success',
        metadata: {
          product_name: 'Dress Elegant',
          marketplace: 'Shopee',
          amount: 150000
        }
      },
      {
        type: 'sale',
        title: 'Transaksi Penjualan',
        description: 'Penjualan Kemeja Casual di Tokopedia',
        status: 'success', 
        metadata: {
          product_name: 'Kemeja Casual',
          marketplace: 'Tokopedia',
          amount: 125000
        }
      },
      {
        type: 'stock',
        title: 'Perubahan Stok',
        description: 'Stok Kemeja Casual bertambah 10 unit',
        status: 'info',
        metadata: {
          product_name: 'Kemeja Casual',
          action: 'increase',
          quantity: 10
        }
      },
      {
        type: 'advertising',
        title: 'Aktivitas Iklan',
        description: 'Campaign Summer Sale dimulai dengan budget 500000',
        status: 'info',
        metadata: {
          campaign_name: 'Summer Sale',
          action: 'started',
          amount: 500000
        }
      }
    ];
    
    // Insert sample activities with different timestamps
    for (let i = 0; i < sampleActivities.length; i++) {
      const activity = sampleActivities[i];
      const createdAt = new Date(Date.now() - (i * 3600000)); // Each activity 1 hour apart
      
      await client.query(`
        INSERT INTO activity_logs (
          type, title, description, status, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $6)
        ON CONFLICT DO NOTHING
      `, [
        activity.type,
        activity.title, 
        activity.description,
        activity.status,
        JSON.stringify(activity.metadata),
        createdAt.toISOString()
      ]);
    }
    
    console.log('✅ Sample activities added successfully!');
    
    // Verify setup
    const activityCount = await client.query('SELECT COUNT(*) as count FROM activity_logs');
    console.log(`📊 Total activities in database: ${activityCount.rows[0].count}`);
    
    // Show recent activities
    const recentActivities = await client.query(`
      SELECT type, title, description, status, created_at
      FROM activity_logs
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('📝 Recent activities:');
    recentActivities.rows.forEach((activity, index) => {
      console.log(`${index + 1}. [${activity.type.toUpperCase()}] ${activity.title}`);
      console.log(`   ${activity.description}`);
      console.log(`   Status: ${activity.status} | Time: ${new Date(activity.created_at).toLocaleString()}`);
      console.log('');
    });
    
    console.log('🎉 Activity Logs system setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupActivityLogs()
    .then(() => {
      console.log('✅ Activity Logs setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupActivityLogs };