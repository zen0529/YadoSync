const BEDS24_BASE_URL = 'https://api.beds24.com/v2'

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'token': import.meta.env.VITE_BEDS24_API_KEY,
})

// --- Transform functions (private, never exported) ---

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
  commissionAmount: 0, // calculated separately using commission_rate from DB
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

// --- Adapter methods ---

const getBookings = async (propertyId) => {
  const res = await fetch(`${BEDS24_BASE_URL}/bookings?propertyId=${propertyId}`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`Beds24 getBookings failed: ${res.status}`)
  const data = await res.json()
  return data.map(toYadoBooking)
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

const createProperty = async (form) => {
  const res = await fetch(`${BEDS24_BASE_URL}/properties`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify([{
      name: form.name,
      propertyType: form.propertyType,
      currency: form.currency,
      address: form.address,
      city: form.city,
      state: form.state,
      country: form.country,
      postcode: form.postcode,
      mobile: form.ownerPhone,
    }]),
  })
  if (!res.ok) throw new Error(`Beds24 createProperty failed: ${res.status}`)
  const data = await res.json()
  const result = data[0]
  console.log('Beds24 createProperty response:', result)
  if (!result.success) {
    throw new Error(result.errors?.[0]?.message || 'Beds24 property creation failed')
  }
}

const listProperties = async () => {
  const res = await fetch(`${BEDS24_BASE_URL}/properties`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`Beds24 listProperties failed: ${res.status}`)
  const data = await res.json()

  console.log('Beds24 listProperties response:', data)
  return data.map(toYadoProperty)
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
  createProperty,
  listProperties,
}
