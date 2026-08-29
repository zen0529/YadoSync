// ── Platform definitions ──────────────────────────────────────────────────────
// Only Booking.com is fully wired for Phase 5; others show a "coming soon" badge.
export const PLATFORMS = [
  { id: "booking",     name: "Booking.com",  initials: "BK", bgClass: "bg-[#003580]",  textClass: "text-white",      supported: true  },
  { id: "agoda",       name: "Agoda",        initials: "AG", bgClass: "bg-[#e61e28]",  textClass: "text-white",      supported: false },
  { id: "airbnb",      name: "Airbnb",       initials: "AB", bgClass: "bg-[#ff5a5f]",  textClass: "text-white",      supported: false },
  { id: "traveloka",   name: "Traveloka",    initials: "TV", bgClass: "bg-[#0064d2]",  textClass: "text-white",      supported: false },
  { id: "expedia",     name: "Expedia",      initials: "EX", bgClass: "bg-[#00355f]",  textClass: "text-white",      supported: false },
  { id: "klook",       name: "Klook",        initials: "KL", bgClass: "bg-[#ff5010]",  textClass: "text-white",      supported: false },
  { id: "tripadvisor", name: "TripAdvisor",  initials: "TA", bgClass: "bg-[#34e0a1]",  textClass: "text-gray-900",   supported: false },
  { id: "vrbo",        name: "VRBO",         initials: "VB", bgClass: "bg-[#175adc]",  textClass: "text-white",      supported: false },
];
