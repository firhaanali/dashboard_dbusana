/**
 * Import History Routes
 * Handle CRUD operations for import history tracking
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * GET /api/import-history
 * Fetch import history with pagination and filtering
 */
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            type,
            status,
            user_id,
            date_from,
            date_to
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        // Build filter conditions
        const where = {};
        
        if (type) {
            where.import_type = type;
        }
        
        if (status) {
            where.import_status = status;
        }
        
        if (user_id) {
            where.user_id = user_id;
        }
        
        if (date_from || date_to) {
            where.timestamp = {};
            if (date_from) {
                where.timestamp.gte = new Date(date_from);
            }
            if (date_to) {
                where.timestamp.lte = new Date(date_to);
            }
        }

        // Check if table exists first
        const tableExists = await prisma.$queryRaw`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'import_history'
            );
        `;

        if (!tableExists[0].exists) {
            // Return empty response if table doesn't exist
            return res.json({
                success: true,
                data: {
                    history: [],
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: 0,
                        totalItems: 0,
                        itemsPerPage: parseInt(limit)
                    },
                    statistics: {
                        total_imports: 0,
                        total_records_processed: 0,
                        total_records_imported: 0,
                        total_failed: 0,
                        total_duplicates: 0,
                        average_success_rate: 0,
                        average_processing_time: 0
                    },
                    type_breakdown: {}
                },
                message: 'Import history table not initialized yet. Run migration script to create table.'
            });
        }

        // Fetch history with pagination
        const [history, totalCount] = await Promise.all([
            prisma.importHistory.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                skip,
                take,
                select: {
                    id: true,
                    timestamp: true,
                    user_id: true,
                    import_type: true,
                    file_name: true,
                    file_size: true,
                    total_records: true,
                    imported_records: true,
                    failed_records: true,
                    duplicate_records: true,
                    success_rate: true,
                    processing_time_ms: true,
                    import_status: true,
                    import_summary: true,
                    created_at: true
                }
            }),
            prisma.importHistory.count({ where })
        ]);

        // Calculate statistics
        const stats = await prisma.importHistory.aggregate({
            where,
            _sum: {
                total_records: true,
                imported_records: true,
                failed_records: true,
                duplicate_records: true
            },
            _avg: {
                success_rate: true,
                processing_time_ms: true
            },
            _count: {
                id: true
            }
        });

        // Get type breakdown
        const typeBreakdown = await prisma.importHistory.groupBy({
            by: ['import_type'],
            where,
            _count: {
                id: true
            },
            _sum: {
                imported_records: true
            }
        });

        const response = {
            success: true,
            data: {
                history,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / parseInt(limit)),
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit)
                },
                statistics: {
                    total_imports: stats._count.id,
                    total_records_processed: stats._sum.total_records || 0,
                    total_records_imported: stats._sum.imported_records || 0,
                    total_failed: stats._sum.failed_records || 0,
                    total_duplicates: stats._sum.duplicate_records || 0,
                    average_success_rate: stats._avg.success_rate || 0,
                    average_processing_time: stats._avg.processing_time_ms || 0
                },
                type_breakdown: typeBreakdown.reduce((acc, item) => {
                    acc[item.import_type] = {
                        count: item._count.id,
                        total_imported: item._sum.imported_records || 0
                    };
                    return acc;
                }, {})
            }
        };

        res.json(response);

    } catch (error) {
        console.error('Error fetching import history:', error);
        
        // Handle specific table not found error
        if (error.message.includes('does not exist')) {
            return res.status(500).json({
                success: false,
                message: 'Import history table not found. Please run the migration script.',
                error: error.message,
                fix_instruction: 'Run: node backend/src/scripts/fixImportHistoryError.js'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to fetch import history',
            error: error.message
        });
    }
});

/**
 * POST /api/import-history
 * Create new import history entry
 */
router.post('/', async (req, res) => {
    try {
        const {
            import_type,
            file_name,
            file_size,
            total_records,
            imported_records,
            failed_records = 0,
            duplicate_records = 0,
            processing_time_ms,
            import_summary,
            user_id = 'system',
            source_ip
        } = req.body;

        // Validate required fields
        if (!import_type || !total_records || imported_records === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: import_type, total_records, imported_records'
            });
        }

        // Calculate success rate
        const success_rate = total_records > 0 
            ? parseFloat(((imported_records / total_records) * 100).toFixed(2))
            : 0;

        // Determine status based on results
        let import_status = 'completed';
        if (imported_records === 0) {
            import_status = 'failed';
        } else if (imported_records < total_records) {
            import_status = 'partial';
        }

        // Create import history entry
        const historyEntry = await prisma.importHistory.create({
            data: {
                import_type,
                file_name,
                file_size,
                total_records,
                imported_records,
                failed_records,
                duplicate_records,
                success_rate,
                processing_time_ms,
                import_status,
                import_summary,
                user_id,
                source_ip: source_ip || req.ip
            }
        });

        res.status(201).json({
            success: true,
            message: 'Import history entry created successfully',
            data: historyEntry
        });

    } catch (error) {
        console.error('Error creating import history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create import history entry',
            error: error.message
        });
    }
});

/**
 * GET /api/import-history/stats
 * Get aggregated statistics for dashboard
 */
router.get('/stats', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));

        // Get recent statistics
        const recentStats = await prisma.importHistory.aggregate({
            where: {
                timestamp: {
                    gte: daysAgo
                }
            },
            _sum: {
                total_records: true,
                imported_records: true,
                failed_records: true
            },
            _avg: {
                success_rate: true,
                processing_time_ms: true
            },
            _count: {
                id: true
            }
        });

        // Get daily breakdown for the last 7 days
        const dailyBreakdown = await prisma.$queryRaw`
            SELECT 
                DATE(timestamp) as date,
                COUNT(*) as import_count,
                SUM(imported_records) as total_imported,
                AVG(success_rate) as avg_success_rate
            FROM import_history 
            WHERE timestamp >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
            GROUP BY DATE(timestamp)
            ORDER BY date DESC
            LIMIT 7
        `;

        // Get type distribution
        const typeDistribution = await prisma.importHistory.groupBy({
            by: ['import_type'],
            where: {
                timestamp: {
                    gte: daysAgo
                }
            },
            _count: {
                id: true
            },
            _sum: {
                imported_records: true
            }
        });

        res.json({
            success: true,
            data: {
                recent_stats: {
                    total_imports: recentStats._count.id,
                    total_records: recentStats._sum.total_records || 0,
                    total_imported: recentStats._sum.imported_records || 0,
                    total_failed: recentStats._sum.failed_records || 0,
                    avg_success_rate: recentStats._avg.success_rate || 0,
                    avg_processing_time: recentStats._avg.processing_time_ms || 0
                },
                daily_breakdown: dailyBreakdown,
                type_distribution: typeDistribution
            }
        });

    } catch (error) {
        console.error('Error fetching import history stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch import history statistics',
            error: error.message
        });
    }
});

/**
 * DELETE /api/import-history/:id
 * Delete specific import history entry
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedEntry = await prisma.importHistory.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Import history entry deleted successfully',
            data: deletedEntry
        });

    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Import history entry not found'
            });
        }

        console.error('Error deleting import history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete import history entry',
            error: error.message
        });
    }
});

/**
 * DELETE /api/import-history/bulk
 * Bulk delete import history entries (with optional filters)
 */
router.delete('/bulk', async (req, res) => {
    try {
        const { 
            older_than_days,
            import_type,
            user_id,
            confirm_deletion 
        } = req.body;

        if (!confirm_deletion) {
            return res.status(400).json({
                success: false,
                message: 'Bulk deletion requires confirmation'
            });
        }

        const where = {};

        if (older_than_days) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - parseInt(older_than_days));
            where.timestamp = { lt: cutoffDate };
        }

        if (import_type) {
            where.import_type = import_type;
        }

        if (user_id) {
            where.user_id = user_id;
        }

        const deleteResult = await prisma.importHistory.deleteMany({
            where
        });

        res.json({
            success: true,
            message: `Successfully deleted ${deleteResult.count} import history entries`,
            deleted_count: deleteResult.count
        });

    } catch (error) {
        console.error('Error bulk deleting import history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk delete import history entries',
            error: error.message
        });
    }
});

module.exports = router;