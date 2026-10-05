/**
 * Order Store - Zustand state management for orders
 * Requirements: 2.1, 2.2, 3.1, 3.2
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  Order,
  OrderFilters,
  DEFAULT_ORDER_FILTERS,
} from '@/types/order';

/**
 * Connection status for WebSocket
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

/**
 * Order Store State Interface
 */
export interface OrderState {
  // Data state
  orders: Order[];
  selectedIds: string[];
  filters: OrderFilters;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  
  // Pagination state
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  pageSize: number;
}

/**
 * Order Store Actions Interface
 */
export interface OrderActions {
  // Order CRUD operations
  setOrders: (orders: Order[]) => void;
  updateOrder: (order: Order) => void;
  addOrder: (order: Order) => void;
  removeOrder: (orderId: string) => void;
  
  // Selection management
  setSelectedIds: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Filter management
  setFilters: (filters: Partial<OrderFilters>) => void;
  resetFilters: () => void;
  
  // UI state management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  
  // Pagination management
  setCurrentPage: (page: number) => void;
  setPagination: (total: number, totalPages: number) => void;
  setPageSize: (size: number) => void;
}


/**
 * Combined Order Store Type
 */
export type OrderStore = OrderState & OrderActions;

/**
 * Initial state for the order store
 */
const initialState: OrderState = {
  orders: [],
  selectedIds: [],
  filters: { ...DEFAULT_ORDER_FILTERS },
  isLoading: false,
  error: null,
  connectionStatus: 'disconnected',
  currentPage: 1,
  totalPages: 1,
  totalOrders: 0,
  pageSize: 10,
};

/**
 * Zustand Order Store
 * Manages all order-related state including:
 * - Order data and CRUD operations
 * - Selection state for bulk actions
 * - Filter state for search/filtering
 * - UI state (loading, errors, connection)
 * - Pagination state
 */
export const useOrderStore = create<OrderStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Order CRUD operations
      setOrders: (orders) => set({ orders }, false, 'setOrders'),

      updateOrder: (updatedOrder) =>
        set(
          (state) => ({
            orders: state.orders.map((order) =>
              order._id === updatedOrder._id ? updatedOrder : order
            ),
          }),
          false,
          'updateOrder'
        ),

      addOrder: (newOrder) =>
        set(
          (state) => ({
            orders: [newOrder, ...state.orders],
            totalOrders: state.totalOrders + 1,
          }),
          false,
          'addOrder'
        ),

      removeOrder: (orderId) =>
        set(
          (state) => ({
            orders: state.orders.filter((order) => order._id !== orderId),
            selectedIds: state.selectedIds.filter((id) => id !== orderId),
            totalOrders: Math.max(0, state.totalOrders - 1),
          }),
          false,
          'removeOrder'
        ),

      // Selection management
      setSelectedIds: (ids) => set({ selectedIds: ids }, false, 'setSelectedIds'),

      toggleSelection: (id) =>
        set(
          (state) => ({
            selectedIds: state.selectedIds.includes(id)
              ? state.selectedIds.filter((selectedId) => selectedId !== id)
              : [...state.selectedIds, id],
          }),
          false,
          'toggleSelection'
        ),

      selectAll: () =>
        set(
          (state) => ({
            selectedIds: state.orders.map((order) => order._id),
          }),
          false,
          'selectAll'
        ),

      clearSelection: () => set({ selectedIds: [] }, false, 'clearSelection'),

      // Filter management
      setFilters: (newFilters) =>
        set(
          (state) => ({
            filters: { ...state.filters, ...newFilters },
            currentPage: 1, // Reset to first page when filters change
          }),
          false,
          'setFilters'
        ),

      resetFilters: () =>
        set(
          { filters: { ...DEFAULT_ORDER_FILTERS }, currentPage: 1 },
          false,
          'resetFilters'
        ),

      // UI state management
      setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),

      setError: (error) => set({ error }, false, 'setError'),

      setConnectionStatus: (status) =>
        set({ connectionStatus: status }, false, 'setConnectionStatus'),

      // Pagination management
      setCurrentPage: (page) => set({ currentPage: page }, false, 'setCurrentPage'),

      setPagination: (total, totalPages) =>
        set({ totalOrders: total, totalPages }, false, 'setPagination'),

      setPageSize: (size) =>
        set({ pageSize: size, currentPage: 1 }, false, 'setPageSize'),
    }),
    { name: 'order-store' }
  )
);

/**
 * Selector hooks for common state slices
 */
export const useOrders = () => useOrderStore((state) => state.orders);
export const useSelectedIds = () => useOrderStore((state) => state.selectedIds);
export const useOrderFilters = () => useOrderStore((state) => state.filters);
export const useOrderLoading = () => useOrderStore((state) => state.isLoading);
export const useOrderError = () => useOrderStore((state) => state.error);
export const useConnectionStatus = () => useOrderStore((state) => state.connectionStatus);

/**
 * Get selected orders from the store
 */
export const useSelectedOrders = () =>
  useOrderStore((state) =>
    state.orders.filter((order) => state.selectedIds.includes(order._id))
  );

/**
 * Get selection count
 */
export const useSelectionCount = () =>
  useOrderStore((state) => state.selectedIds.length);
