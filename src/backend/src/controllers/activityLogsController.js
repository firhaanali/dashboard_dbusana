const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Activity Logs Controller
 * Handles real-time activity logging for D'Busana Dashboard
 */

// Get recent activity logs
const getActivityLogs = async (req, res) => {
  try {
    // Check if table exists first
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs'
      );
    `;

    if (!tableExists[0].exists) {
      // Return empty result if table doesn't exist
      console.log('⚠️ Activity logs table does not exist, returning empty result');
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: parseInt(req.query.limit || 20),
          offset: parseInt(req.query.offset || 0),
          hasMore: false
        }
      });
    }

    const {
      limit = 20,
      offset = 0,
      type,
      status,
      user_id,
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    // Build Prisma where conditions
    const whereConditions = {};
    if (type) whereConditions.type = type;
    if (status) whereConditions.status = status;
    if (user_id) whereConditions.user_id = user_id;

    const activities = await prisma.activityLogs.findMany({
      where: whereConditions,
      orderBy: { created_at: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Get total count for pagination
    const total = await prisma.activityLogs.count({
      where: whereConditions
    });

    console.log('✅ Activity logs fetched:', {
      count: activities.length,
      total,
      filters: { type, status, user_id }
    });

    res.json({
      success: true,
      data: activities,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });

  } catch (error) {
    console.error('❌ Error fetching activity logs:', error);
    
    // If it's a table not exists error, return empty result
    if (error.message.includes('relation "activity_logs" does not exist')) {
      console.log('⚠️ Activity logs table does not exist, returning empty result');
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: parseInt(req.query.limit || 20),
          offset: parseInt(req.query.offset || 0),
          hasMore: false
        }
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity logs',
      details: error.message
    });
  }
};

// Create new activity log
const createActivityLog = async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      status = 'info',
      metadata = {},
      user_id,
      related_id,
      related_type
    } = req.body;

    // Validate required fields
    if (!type || !title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, title, description'
      });
    }

    // Validate type
    const validTypes = [
      'sale', 'product', 'customer', 'payment', 'import', 'stock', 
      'advertising', 'affiliate', 'system', 'alert', 'achievement'
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate status
    const validStatuses = ['success', 'warning', 'error', 'info'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Check if table exists first
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs'
      );
    `;

    if (!tableExists[0].exists) {
      console.log('⚠️ Activity logs table does not exist, skipping log creation');
      return res.status(200).json({
        success: true,
        data: null,
        message: 'Activity log skipped - table not available'
      });
    }

    // Use proper Prisma create method instead of raw SQL
    const activity = await prisma.activityLogs.create({
      data: {
        type,
        title,
        description,
        status,
        metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : metadata,
        user_id,
        related_id,
        related_type
      }
    });

    console.log('✅ Activity log created:', {
      id: activity.id,
      type,
      title: title.substring(0, 50) + (title.length > 50 ? '...' : ''),
      status
    });

    res.status(201).json({
      success: true,
      data: activity,
      message: 'Activity log created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating activity log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create activity log',
      details: error.message
    });
  }
};

// Get activity stats
const getActivityStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    // Check if table exists first
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs'
      );
    `;

    if (!tableExists[0].exists) {
      return res.json({
        success: true,
        data: {
          stats: [],
          total: 0,
          typeBreakdown: [],
          period: `${days} days`
        }
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    
    // Use Prisma's native methods where possible
    const activities = await prisma.activityLogs.findMany({
      where: {
        created_at: {
          gte: daysAgo
        }
      },
      select: {
        type: true,
        status: true,
        created_at: true
      }
    });

    // Process stats in JavaScript to avoid complex raw queries
    const statsMap = {};
    const typeMap = {};
    
    activities.forEach(activity => {
      const date = activity.created_at.toISOString().split('T')[0];
      const key = `${activity.type}-${activity.status}-${date}`;
      statsMap[key] = (statsMap[key] || 0) + 1;
      typeMap[activity.type] = (typeMap[activity.type] || 0) + 1;
    });

    const stats = Object.entries(statsMap).map(([key, count]) => {
      const [type, status, date] = key.split('-');
      return { type, status, count, date };
    });

    const typeBreakdown = Object.entries(typeMap).map(([type, count]) => ({
      type, count
    }));

    res.json({
      success: true,
      data: {
        stats,
        total: activities.length,
        typeBreakdown,
        period: `${days} days`
      }
    });

  } catch (error) {
    console.error('❌ Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity stats',
      details: error.message
    });
  }
};

// Delete old activity logs (cleanup)
const cleanupActivityLogs = async (req, res) => {
  try {
    const { days = 90 } = req.query;
    
    // Check if table exists first
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs'
      );
    `;

    if (!tableExists[0].exists) {
      return res.json({
        success: true,
        data: {
          deletedCount: 0,
          daysThreshold: parseInt(days)
        },
        message: 'Activity logs table does not exist'
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const deleted = await prisma.activityLogs.deleteMany({
      where: {
        created_at: {
          lt: daysAgo
        }
      }
    });

    console.log(`✅ Cleaned up activity logs older than ${days} days:`, deleted.count);

    res.json({
      success: true,
      data: {
        deletedCount: deleted.count,
        daysThreshold: parseInt(days)
      },
      message: `Cleaned up ${deleted.count} activity logs older than ${days} days`
    });

  } catch (error) {
    console.error('❌ Error cleaning up activity logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup activity logs',
      details: error.message
    });
  }
};

module.exports = {
  getActivityLogs,
  createActivityLog,
  getActivityStats,
  cleanupActivityLogs
};