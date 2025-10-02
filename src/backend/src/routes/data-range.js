const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Development middleware for CORS
router.use((req, res, next) => {
  if (req.headers['x-development-only'] === 'true') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-development-only');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
  }
  next();
});

// GET /api/data-range - Get actual date range from database
router.get('/', async (req, res) => {
  try {
    console.log('📅 Getting actual date range from database...');
    
    // Get earliest and latest dates from sales data, prioritizing delivered_time
    const salesData = await prisma.salesData.findMany({
      select: {
        delivered_time: true,
        created_time: true
      },
      orderBy: {
        delivered_time: 'asc'
      }
    });
    
    if (salesData.length === 0) {
      console.log('⚠️ No sales data found in database');
      // Return a default date range for current month if no data
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      return res.json({
        success: true,
        data: {
          fullRange: {
            from: currentMonthStart,
            to: now,
            days: now.getDate()
          },
          suggestedPeriods: {
            last30Days: {
              from: new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)),
              to: now
            },
            last7Days: {
              from: new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)),
              to: now
            },
            currentMonth: {
              from: currentMonthStart,
              to: now
            },
            fullPeriod: {
              from: currentMonthStart,
              to: now
            }
          },
          dataInfo: {
            totalRecords: 0,
            validDates: 0,
            earliestDate: currentMonthStart.toISOString(),
            latestDate: now.toISOString(),
            periodLabel: `No data - showing current month`
          }
        },
        message: 'No sales data found, showing default current month range'
      });
    }
    
    // Extract valid dates, prioritizing delivered_time
    const dates = salesData
      .map(item => {
        const deliveredTime = item.delivered_time ? new Date(item.delivered_time) : null;
        const createdTime = item.created_time ? new Date(item.created_time) : null;
        
        // Prioritize delivered_time if available and valid
        if (deliveredTime && !isNaN(deliveredTime.getTime())) {
          return deliveredTime;
        }
        if (createdTime && !isNaN(createdTime.getTime())) {
          return createdTime;
        }
        return null;
      })
      .filter(date => date !== null)
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (dates.length === 0) {
      console.log('⚠️ No valid dates found in sales data');
      // Return current month as fallback
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      return res.json({
        success: true,
        data: {
          fullRange: {
            from: currentMonthStart,
            to: now,
            days: now.getDate()
          },
          suggestedPeriods: {
            last30Days: {
              from: new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)),
              to: now
            },
            last7Days: {
              from: new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)),
              to: now
            },
            currentMonth: {
              from: currentMonthStart,
              to: now
            },
            fullPeriod: {
              from: currentMonthStart,
              to: now
            }
          },
          dataInfo: {
            totalRecords: salesData.length,
            validDates: 0,
            earliestDate: currentMonthStart.toISOString(),
            latestDate: now.toISOString(),
            periodLabel: `Invalid dates - showing current month fallback`
          }
        },
        message: 'No valid dates found in sales data, showing fallback range'
      });
    }
    
    const earliestDate = dates[0];
    const latestDate = dates[dates.length - 1];
    
    // Calculate some useful periods
    const last30Days = {
      from: new Date(latestDate.getTime() - (30 * 24 * 60 * 60 * 1000)),
      to: latestDate
    };
    
    const last7Days = {
      from: new Date(latestDate.getTime() - (7 * 24 * 60 * 60 * 1000)),
      to: latestDate
    };
    
    const currentMonth = {
      from: new Date(latestDate.getFullYear(), latestDate.getMonth(), 1),
      to: latestDate
    };
    
    const result = {
      fullRange: {
        from: earliestDate,
        to: latestDate,
        days: Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (24 * 60 * 60 * 1000))
      },
      suggestedPeriods: {
        last30Days,
        last7Days,
        currentMonth,
        fullPeriod: {
          from: earliestDate,
          to: latestDate
        }
      },
      dataInfo: {
        totalRecords: salesData.length,
        validDates: dates.length,
        earliestDate: earliestDate.toISOString(),
        latestDate: latestDate.toISOString(),
        periodLabel: `${earliestDate.toLocaleDateString('id-ID')} - ${latestDate.toLocaleDateString('id-ID')}`
      }
    };
    
    console.log('✅ Data date range calculated:', {
      fullRange: `${earliestDate.toISOString().split('T')[0]} to ${latestDate.toISOString().split('T')[0]}`,
      totalDays: result.fullRange.days,
      totalRecords: result.dataInfo.totalRecords
    });
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Error getting data date range:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get data date range',
      message: error.message
    });
  }
});

module.exports = router;