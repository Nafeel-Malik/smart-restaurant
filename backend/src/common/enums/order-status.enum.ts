export enum OrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Preparing = 'preparing',
  Ready = 'ready',
  Served = 'served',
  OutForDelivery = 'out_for_delivery',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}

/** Customer may cancel/edit while kitchen has not started prep. */
export const CUSTOMER_CANCELLABLE_STATUSES = [OrderStatus.Pending, OrderStatus.Confirmed] as const;

/** Final statuses that make an order eligible for a customer review. */
export const REVIEWABLE_DELIVERY_STATUSES = [OrderStatus.Delivered] as const;
export const REVIEWABLE_PREORDER_STATUSES = [OrderStatus.Served] as const;

export const ALL_ORDER_STATUSES = Object.values(OrderStatus);

