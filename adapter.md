# Channel Manager Adapter — Implementation Guide

This file documents the exact implementation of the adapter pattern used for channel manager integration in YadoManagement. Claude Code must follow this guide strictly when writing any channel manager related code.

---

## Why This Exists

YadoManagement currently uses **Beds24** as the channel manager backbone. In the future, it will switch to **Channex** for cost reasons at scale. The adapter pattern ensures that switching providers requires changing only **one line of code** in `channelManager.js` — nothing else in the codebase changes.

---

## File Structure

```
src/lib/api/
  channelManager.js          ← the only file the rest of the app imports from
  adapters/
    beds24Adapter.js         ← current Beds24 implementation
    channexAdapter.js        ← future Channex implementation (do not build yet)
```

---

## The Adapter Interface

Both `beds24Adapter.js` and `channexAdapter.js` MUST implement exactly these methods with exactly these signatures. No extra methods, no different names.

```js
{
  // Fetch all bookings for a property
  getBookings: async (propertyId) => {
    // Returns: Array of booking objects in YadoManagement format (see Data Formats below)
  },

  // Block specific dates on all connected OTA platforms
  blockDates: async (propertyId, dates) => {
    // dates: Array of ISO date strings e.g. ["2026-04-13", "2026-04-14"]
    // Returns: { success: boolean, failedDates: [] }
  },

  // Get current availability for a property
  getAvailability: async (propertyId, startDate, endDate) => {
    // startDate, endDate: ISO date strings
    // Returns: Array of { date: string, available: boolean, bookedCount: number }
  },

  // Full sync of a property — pull latest data from the channel manager
  syncProperty: async (propertyId) => {
    // Returns: { success: boolean, bookingsSynced: number, errors: [] }
  },

  // Get property details from the channel manager
  getProperty: async (propertyId) => {
    // Returns: Property object in YadoManagement format
  },

  // Verify that a connection to the channel manager works
  verifyConnection: async (apiKey) => {
    // Returns: { connected: boolean, error: string | null }
  },
}
```

---

## File 1: channelManager.js

This is the **only file** the rest of the app should import from. It exports the currently active adapter.

```js
import { beds24Adapter } from './adapters/beds24Adapter'

// To switch to Channex in the future, change this one line:
// import { channexAdapter } from './adapters/channexAdapter'

export const channelManager = beds24Adapter
```

**Rules:**
- Never add any logic to this file — it is a pure re-export
- Never import from `beds24Adapter.js` or `channexAdapter.js` anywhere else in the codebase
- Always import `channelManager` from this file

---

## File 2: beds24Adapter.js

The current implementation using the Beds24 API.

```js
const BEDS24_BASE_URL = 'https://api.beds24.com/v2'

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'token': import.meta.env.VITE_BEDS24_API_KEY,
})

const getBookings = async (propertyId) => {
  const res = await fetch(`${BEDS24_BASE_URL}/bookings?propertyId=${propertyId}`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`Beds24 getBookings failed: ${res.status}`)
  const data = await res.json()
  return data.map(toYadoBooking)  // always transform to YadoManagement format
}

const blockDates = async (propertyId, dates) => {
  const failedDates = []
  for (const date of dates) {
    try {
      await fetch(`${BEDS24_BASE_URL}/availability`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ propertyId, date, available: 0 }),
      })
    } catch {
      failedDates.push(date)
    }
  }
  return { success: failedDates.length === 0, failedDates }
}

const getAvailability = async (propertyId, startDate, endDate) => {
  const res = await fetch(
    `${BEDS24_BASE_URL}/availability?propertyId=${propertyId}&startDate=${startDate}&endDate=${endDate}`,
    { headers: getHeaders() }
  )
  if (!res.ok) throw new Error(`Beds24 getAvailability failed: ${res.status}`)
  const data = await res.json()
  return data.map(toYadoAvailability)
}

const syncProperty = async (propertyId) => {
  try {
    const bookings = await getBookings(propertyId)
    return { success: true, bookingsSynced: bookings.length, errors: [] }
  } catch (err) {
    return { success: false, bookingsSynced: 0, errors: [err.message] }
  }
}

const getProperty = async (propertyId) => {
  const res = await fetch(`${BEDS24_BASE_URL}/properties/${propertyId}`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`Beds24 getProperty failed: ${res.status}`)
  const data = await res.json()
  return toYadoProperty(data)
}

const verifyConnection = async (apiKey) => {
  try {
    const res = await fetch(`${BEDS24_BASE_URL}/authentication/setup`, {
      headers: { 'Content-Type': 'application/json', 'token': apiKey },
    })
    return { connected: res.ok, error: res.ok ? null : 'Invalid API key' }
  } catch (err) {
    return { connected: false, error: err.message }
  }
}

export const beds24Adapter = {
  getBookings,
  blockDates,
  getAvailability,
  syncProperty,
  getProperty,
  verifyConnection,
}
```

---

## File 3: channexAdapter.js (DO NOT BUILD YET)

When the time comes to switch to Channex, create this file implementing the same interface:

```js
// TODO: Build this when switching to Channex
// Must implement all methods from the adapter interface above
// with the same signatures and return formats

export const channexAdapter = {
  getBookings: async (propertyId) => { /* Channex implementation */ },
  blockDates: async (propertyId, dates) => { /* Channex implementation */ },
  getAvailability: async (propertyId, startDate, endDate) => { /* Channex implementation */ },
  syncProperty: async (propertyId) => { /* Channex implementation */ },
  getProperty: async (propertyId) => { /* Channex implementation */ },
  verifyConnection: async (apiKey) => { /* Channex implementation */ },
}
```

Then in `channelManager.js`, change one line:
```js
// Before:
import { beds24Adapter } from './adapters/beds24Adapter'
export const channelManager = beds24Adapter

// After:
import { channexAdapter } from './adapters/channexAdapter'
export const channelManager = channexAdapter
```

---

## Data Formats

All adapters must return data in **YadoManagement format** — not in the channel manager's native format. Transform data inside the adapter before returning.

### Booking Object
```js
{
  id: string,                  // YadoManagement booking ID
  externalId: string,          // Beds24 or Channex booking ID
  propertyId: string,
  platform: string,            // 'booking' | 'agoda' | 'airbnb' | 'traveloka'
  guestName: string,
  guestEmail: string,
  checkIn: string,             // ISO date string 'YYYY-MM-DD'
  checkOut: string,            // ISO date string 'YYYY-MM-DD'
  totalAmount: number,         // in PHP (float)
  commissionAmount: number,    // totalAmount × commissionRate / 100
  status: string,              // 'confirmed' | 'cancelled' | 'modified'
  bookedAt: string,            // ISO datetime string
}
```

### Availability Object
```js
{
  date: string,                // ISO date string 'YYYY-MM-DD'
  available: boolean,
  bookedCount: number,         // number of rooms/units booked on this date
}
```

### Property Object
```js
{
  id: string,
  externalId: string,          // Beds24 or Channex property ID
  name: string,
  location: string,
  totalRooms: number,
}
```

---

## Transform Functions

Each adapter must include private transform functions to convert from the provider's format to YadoManagement format. These are internal to each adapter — never exported.

```js
// Inside beds24Adapter.js
const toYadoBooking = (beds24Booking) => ({
  id: beds24Booking.bookId,
  externalId: beds24Booking.bookId,
  propertyId: beds24Booking.propId,
  platform: mapPlatform(beds24Booking.referer),
  guestName: beds24Booking.guestFirstName + ' ' + beds24Booking.guestName,
  guestEmail: beds24Booking.guestEmail,
  checkIn: beds24Booking.firstNight,
  checkOut: beds24Booking.lastNight,
  totalAmount: parseFloat(beds24Booking.price),
  commissionAmount: 0,         // calculated separately using commission_rate from DB
  status: mapStatus(beds24Booking.status),
  bookedAt: beds24Booking.bookingTime,
})

const toYadoAvailability = (beds24Avail) => ({
  date: beds24Avail.date,
  available: beds24Avail.available > 0,
  bookedCount: beds24Avail.booked || 0,
})

const toYadoProperty = (beds24Property) => ({
  id: beds24Property.propId,
  externalId: beds24Property.propId,
  name: beds24Property.name,
  location: beds24Property.city,
  totalRooms: beds24Property.numRooms || 1,
})

const mapPlatform = (referer) => {
  const map = {
    'Booking.com': 'booking',
    'Agoda': 'agoda',
    'Airbnb': 'airbnb',
    'Traveloka': 'traveloka',
  }
  return map[referer] || 'other'
}

const mapStatus = (status) => {
  const map = {
    '0': 'confirmed',
    '1': 'cancelled',
    '2': 'modified',
  }
  return map[String(status)] || 'confirmed'
}
```

---

## How to Use in Edge Functions

```js
// supabase/functions/webhook-beds24/index.js
import { channelManager } from '../../src/lib/api/channelManager.js'

// Get bookings for a property
const bookings = await channelManager.getBookings(propertyId)

// Block dates after a booking
await channelManager.blockDates(propertyId, ['2026-04-13', '2026-04-14'])

// Verify a new property owner's Beds24 connection
const { connected, error } = await channelManager.verifyConnection(apiKey)
```

---

## Rules Summary

| Rule | Detail |
|---|---|
| Always import from | `channelManager.js` |
| Never import from | `beds24Adapter.js` or `channexAdapter.js` directly |
| Never call | Beds24 or Channex APIs from React components |
| Always transform | Channel manager data to YadoManagement format inside the adapter |
| Never build | `channexAdapter.js` until switching to Channex |
| One line to switch | Change the import in `channelManager.js` only |