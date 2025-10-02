export const SALES_TABLE_CONFIG = {
  ITEMS_PER_PAGE: 50, // Increased to show more records in table view
  DEFAULT_SORT_BY: 'delivered_time',
  DEFAULT_SORT_ORDER: 'desc' as const,
  LARGE_DATASET_THRESHOLD: 1000, // Show warning when data exceeds this
} as const;

export const SALES_STATUS_FILTERS = {
  ALL: 'all',
  COMPLETED: 'completed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
} as const;

export const SALES_TABLE_COLUMNS = {
  ORDER_ID: 'order_id',
  PRODUCT_NAME: 'product_name',
  QUANTITY: 'quantity',
  TOTAL_REVENUE: 'total_revenue',
  DELIVERED_TIME: 'delivered_time',
  CREATED_TIME: 'created_time',
} as const;