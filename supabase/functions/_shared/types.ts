/**
 * _shared/types.ts
 *
 * Shared Channex TypeScript interfaces used across all edge functions.
 */

// ── Availability / Restriction entry types ─────────────────────────────────

export interface AvailabilityEntry {
  date: string;       // YYYY-MM-DD
  available: number;
}

export interface RestrictionEntry {
  date: string;       // YYYY-MM-DD
  rate: number;       // major units (pesos) in Supabase; converted to cents before sending to Channex
  min_stay_arrival?: number;
  min_stay_through?: number;
  max_stay?: number;
  stop_sell?: boolean;
  closed_to_arrival?: boolean;
  closed_to_departure?: boolean;
}

/** A run-length-encoded range for availability */
export interface AvailabilityRange {
  date_from: string;
  date_to: string;
  availability: number;
}

/** A run-length-encoded range for restrictions (per_room) */
export interface RestrictionRange {
  date_from: string;
  date_to: string;
  rate?: number;
  min_stay_arrival?: number;
  min_stay_through?: number;
  max_stay?: number;
  stop_sell?: boolean;
  closed_to_arrival?: boolean;
  closed_to_departure?: boolean;
}

/** A run-length-encoded range for restrictions (per_person) */
export interface RestrictionRangePerPerson {
  date_from: string;
  date_to: string;
  rates: Array<{ occupancy: number; rate: number }>;
  min_stay_arrival?: number;
  min_stay_through?: number;
  max_stay?: number;
  stop_sell?: boolean;
  closed_to_arrival?: boolean;
  closed_to_departure?: boolean;
}

// ── Booking revision types ─────────────────────────────────────────────────

export interface BookingRoom {
  checkin_date:  string;
  checkout_date: string;
  room_type_id:  string | null;
  rate_plan_id:  string | null;
  amount:        string;       // decimal string, major units e.g. "230.00"
  days:          Record<string, string>;
  occupancy:     { adults: number; children: number; infants: number };
}

export interface BookingRevisionAttributes {
  id:                   string;
  property_id:          string;
  booking_id:           string;
  unique_id:            string;
  system_id:            string;
  ota_reservation_code: string;
  ota_name:             string;
  /** "new" | "modified" | "cancellation" */
  status:               string;
  rooms:                BookingRoom[];
  services:             unknown[];
  customer: {
    name?:    string;
    surname?: string;
    mail?:    string;
    phone?:   string;
  };
  arrival_date:   string;
  departure_date: string;
  arrival_hour?:  string;
  amount:         string;   // decimal string, major units
  currency:       string;
  notes?:         string;
  inserted_at:    string;
}

export interface BookingRevision {
  type:       string;
  id:         string;
  attributes: BookingRevisionAttributes;
}

export interface BookingRevisionFeedMeta {
  total: number;
  limit: number;
  page:  number;
}

export interface BookingRevisionFeed {
  data: BookingRevision[];
  meta: BookingRevisionFeedMeta;
}
