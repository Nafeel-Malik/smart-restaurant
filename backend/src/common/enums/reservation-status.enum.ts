export enum ReservationStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Seated = 'seated',
  Completed = 'completed',
  Cancelled = 'cancelled',
  NoShow = 'no_show',
}

/** Statuses that still occupy restaurant capacity for a slot. */
export const ACTIVE_RESERVATION_STATUSES = [
  ReservationStatus.Pending,
  ReservationStatus.Confirmed,
  ReservationStatus.Seated,
] as const;

/** Customer may cancel while the booking is still upcoming and not started. */
export const CUSTOMER_CANCELLABLE_RESERVATION_STATUSES = [
  ReservationStatus.Pending,
  ReservationStatus.Confirmed,
] as const;

export const ALL_RESERVATION_STATUSES = Object.values(ReservationStatus);
