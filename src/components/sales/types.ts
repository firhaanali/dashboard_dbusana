export interface SalesTableProps {
  data: any[];
  loading: boolean;
}

export interface SalesDataItem {
  order_id?: string;
  seller_sku: string;
  product_name: string;
  color?: string;
  size?: string;
  quantity: number;
  order_amount?: number;
  total_revenue?: number;
  hpp?: number;
  created_time: string | Date | number;
  delivered_time?: string | Date | number;
}

export type SortOrder = 'asc' | 'desc';

export type ViewMode = 'table' | 'cards';