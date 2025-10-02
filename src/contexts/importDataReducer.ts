import type { ImportDataState, ImportDataAction, ImportStats } from './importDataTypes';

// Initial state
export const initialState: ImportDataState = {
  salesData: [],
  productData: [],
  stockData: [],
  stats: {
    sales: {
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      importedRecords: 0,
    },
    products: {
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      importedRecords: 0,
    },
    stock: {
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      importedRecords: 0,
    },
  },
  isLoading: false,
  error: null,
};

// Reducer
export function importDataReducer(state: ImportDataState, action: ImportDataAction): ImportDataState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'SET_SALES_DATA':
      return {
        ...state,
        salesData: action.payload.data,
        stats: {
          ...state.stats,
          sales: action.payload.stats,
        },
        isLoading: false,
        error: null,
      };

    case 'SET_PRODUCT_DATA':
      return {
        ...state,
        productData: action.payload.data,
        stats: {
          ...state.stats,
          products: action.payload.stats,
        },
        isLoading: false,
        error: null,
      };

    case 'SET_STOCK_DATA':
      return {
        ...state,
        stockData: action.payload.data,
        stats: {
          ...state.stats,
          stock: action.payload.stats,
        },
        isLoading: false,
        error: null,
      };

    case 'ADD_PRODUCT':
      return {
        ...state,
        productData: [...state.productData, action.payload],
        stats: {
          ...state.stats,
          products: {
            ...state.stats.products,
            totalRecords: state.stats.products.totalRecords + 1,
            validRecords: state.stats.products.validRecords + 1,
            importedRecords: state.stats.products.importedRecords + 1,
          },
        },
      };

    case 'UPDATE_PRODUCT':
      return {
        ...state,
        productData: state.productData.map(product =>
          product.product_code === action.payload.id || (product as any).id === action.payload.id
            ? { ...product, ...action.payload.product }
            : product
        ),
      };

    case 'UPDATE_PRODUCT_STOCK':
      return {
        ...state,
        productData: state.productData.map(product =>
          product.product_code === action.payload.id || (product as any).id === action.payload.id
            ? { ...product, stock_quantity: action.payload.stock_quantity }
            : product
        ),
      };

    case 'DELETE_PRODUCT':
      return {
        ...state,
        productData: state.productData.filter(product =>
          product.product_code !== action.payload && (product as any).id !== action.payload
        ),
        stats: {
          ...state.stats,
          products: {
            ...state.stats.products,
            totalRecords: Math.max(0, state.stats.products.totalRecords - 1),
            validRecords: Math.max(0, state.stats.products.validRecords - 1),
            importedRecords: Math.max(0, state.stats.products.importedRecords - 1),
          },
        },
      };

    case 'CLEAR_SALES_DATA':
      return {
        ...state,
        salesData: [],
        stats: {
          ...state.stats,
          sales: initialState.stats.sales,
        },
      };

    case 'CLEAR_PRODUCT_DATA':
      return {
        ...state,
        productData: [],
        stats: {
          ...state.stats,
          products: initialState.stats.products,
        },
      };

    case 'CLEAR_STOCK_DATA':
      return {
        ...state,
        stockData: [],
        stats: {
          ...state.stats,
          stock: initialState.stats.stock,
        },
      };

    case 'CLEAR_ALL_DATA':
      return initialState;

    case 'UPDATE_IMPORT_STATS':
      return {
        ...state,
        stats: {
          ...state.stats,
          [action.payload.type]: {
            ...state.stats[action.payload.type],
            ...action.payload.stats,
          },
        },
      };

    case 'IMPORT_SUCCESS':
      // For now, just log the success - can be extended later
      console.log(`✅ Import success: ${action.payload.type}`, action.payload);
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}