/**
 * Customer Aggregation Utilities
 * Handles aggregation of customers with missing names based on geographic location
 */

export interface CustomerData {
  id?: string;
  customer: string;
  regency_city: string;
  province: string;
  order_amount?: number;
  quantity?: number;
  created_time?: Date;
  [key: string]: any;
}

export interface AggregatedCustomer {
  id: string;
  display_name: string;
  regency_city: string;
  province: string;
  location_key: string;
  customer_count: number;
  total_orders: number;
  total_amount: number;
  total_quantity: number;
  first_order_date: Date | null;
  last_order_date: Date | null;
  is_aggregated: boolean;
}

/**
 * Generate unique location key for customer aggregation
 */
export const generateLocationKey = (regencyCity: string, province: string): string => {
  const cleanRegency = (regencyCity || '').toString().trim().toLowerCase();
  const cleanProvince = (province || '').toString().trim().toLowerCase();
  
  if (!cleanRegency && !cleanProvince) {
    return 'unknown-location';
  }
  
  return `${cleanProvince}-${cleanRegency}`.replace(/\s+/g, '-');
};

/**
 * Check if customer data represents an unknown/missing customer
 */
export const isUnknownCustomer = (customer: string): boolean => {
  if (!customer) return true;
  
  const cleanCustomer = customer.toString().trim().toLowerCase();
  
  // Check for various representations of unknown/missing customers
  const unknownPatterns = [
    '',
    '-',
    'unknown',
    'tidak diketahui',
    'customer tidak diketahui',
    'n/a',
    'na',
    'null',
    'undefined',
    'kosong',
    'belum ada',
    'no name',
    'no customer',
    '.'
  ];
  
  return unknownPatterns.includes(cleanCustomer) || 
         cleanCustomer.length === 0 ||
         /^[-_\s.]*$/.test(cleanCustomer);
};

/**
 * Generate display name for aggregated unknown customers
 */
export const generateAggregatedDisplayName = (regencyCity: string, province: string, count: number): string => {
  const cleanRegency = (regencyCity || '').toString().trim();
  const cleanProvince = (province || '').toString().trim();
  
  if (!cleanRegency && !cleanProvince) {
    return `Customer Tidak Diketahui (${count} pesanan)`;
  }
  
  if (!cleanRegency) {
    return `Customer Tidak Diketahui - ${cleanProvince} (${count} pesanan)`;
  }
  
  if (!cleanProvince) {
    return `Customer Tidak Diketahui - ${cleanRegency} (${count} pesanan)`;
  }
  
  return `Customer Tidak Diketahui - ${cleanRegency}, ${cleanProvince} (${count} pesanan)`;
};

/**
 * Aggregate customer data by location
 */
export const aggregateCustomersByLocation = (customerData: CustomerData[]): AggregatedCustomer[] => {
  const locationGroups = new Map<string, CustomerData[]>();
  const knownCustomers: AggregatedCustomer[] = [];
  
  // Group customers by location and separate known vs unknown
  customerData.forEach(customer => {
    if (isUnknownCustomer(customer.customer)) {
      // Group unknown customers by location
      const locationKey = generateLocationKey(customer.regency_city, customer.province);
      
      if (!locationGroups.has(locationKey)) {
        locationGroups.set(locationKey, []);
      }
      
      locationGroups.get(locationKey)!.push(customer);
    } else {
      // Keep known customers as-is
      knownCustomers.push({
        id: customer.id || `known-${Date.now()}-${Math.random()}`,
        display_name: customer.customer,
        regency_city: customer.regency_city || '',
        province: customer.province || '',
        location_key: generateLocationKey(customer.regency_city, customer.province),
        customer_count: 1,
        total_orders: 1,
        total_amount: customer.order_amount || 0,
        total_quantity: customer.quantity || 0,
        first_order_date: customer.created_time || null,
        last_order_date: customer.created_time || null,
        is_aggregated: false
      });
    }
  });
  
  // Create aggregated customers for each location group
  const aggregatedCustomers: AggregatedCustomer[] = [];
  
  locationGroups.forEach((customers, locationKey) => {
    const totalAmount = customers.reduce((sum, c) => sum + (c.order_amount || 0), 0);
    const totalQuantity = customers.reduce((sum, c) => sum + (c.quantity || 0), 0);
    const dates = customers.map(c => c.created_time).filter(Boolean) as Date[];
    
    const firstCustomer = customers[0];
    
    aggregatedCustomers.push({
      id: `aggregated-${locationKey}`,
      display_name: generateAggregatedDisplayName(
        firstCustomer.regency_city, 
        firstCustomer.province, 
        customers.length
      ),
      regency_city: firstCustomer.regency_city || '',
      province: firstCustomer.province || '',
      location_key: locationKey,
      customer_count: customers.length,
      total_orders: customers.length,
      total_amount: totalAmount,
      total_quantity: totalQuantity,
      first_order_date: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null,
      last_order_date: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null,
      is_aggregated: true
    });
  });
  
  return [...knownCustomers, ...aggregatedCustomers];
};

/**
 * Get customer analytics with aggregation
 */
export const getCustomerAnalyticsWithAggregation = (customerData: CustomerData[]) => {
  const aggregatedCustomers = aggregateCustomersByLocation(customerData);
  
  const totalCustomers = aggregatedCustomers.length;
  const knownCustomers = aggregatedCustomers.filter(c => !c.is_aggregated).length;
  const unknownCustomerGroups = aggregatedCustomers.filter(c => c.is_aggregated).length;
  const totalUnknownOrders = aggregatedCustomers
    .filter(c => c.is_aggregated)
    .reduce((sum, c) => sum + c.total_orders, 0);
  
  // Top customers by amount
  const topCustomers = aggregatedCustomers
    .sort((a, b) => b.total_amount - a.total_amount)
    .slice(0, 10);
  
  // Customer distribution by province
  const provinceDistribution = aggregatedCustomers.reduce((acc, customer) => {
    const province = customer.province || 'Tidak Diketahui';
    if (!acc[province]) {
      acc[province] = {
        province,
        customer_count: 0,
        total_amount: 0,
        known_customers: 0,
        unknown_groups: 0
      };
    }
    
    acc[province].customer_count += customer.is_aggregated ? customer.customer_count : 1;
    acc[province].total_amount += customer.total_amount;
    
    if (customer.is_aggregated) {
      acc[province].unknown_groups += 1;
    } else {
      acc[province].known_customers += 1;
    }
    
    return acc;
  }, {} as Record<string, any>);
  
  return {
    aggregatedCustomers,
    analytics: {
      totalCustomers,
      knownCustomers,
      unknownCustomerGroups,
      totalUnknownOrders,
      unknownOrdersPercentage: customerData.length > 0 ? (totalUnknownOrders / customerData.length) * 100 : 0,
      topCustomers,
      provinceDistribution: Object.values(provinceDistribution)
    }
  };
};

/**
 * Format customer display for UI components
 */
export const formatCustomerDisplay = (customer: AggregatedCustomer): string => {
  if (!customer.is_aggregated) {
    return customer.display_name;
  }
  
  return customer.display_name;
};

/**
 * Get customer location summary
 */
export const getCustomerLocationSummary = (customer: AggregatedCustomer): string => {
  if (!customer.regency_city && !customer.province) {
    return 'Lokasi tidak diketahui';
  }
  
  if (!customer.regency_city) {
    return customer.province;
  }
  
  if (!customer.province) {
    return customer.regency_city;
  }
  
  return `${customer.regency_city}, ${customer.province}`;
};

/**
 * Export utilities for use in other components
 */
export const customerAggregationUtils = {
  generateLocationKey,
  isUnknownCustomer,
  generateAggregatedDisplayName,
  aggregateCustomersByLocation,
  getCustomerAnalyticsWithAggregation,
  formatCustomerDisplay,
  getCustomerLocationSummary
};