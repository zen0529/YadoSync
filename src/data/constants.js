export const BOOKINGS = [
  { id: 1, guest: "Maria Santos",   resort: "Coral Bay Resort", dates: "Mar 28–29",    platform: "klook",   sync: "synced"  },
  { id: 2, guest: "Juan dela Cruz", resort: "Blue Lagoon Inn",  dates: "Mar 30–Apr 2", platform: "booking", sync: "pending" },
  { id: 3, guest: "Anna Reyes",     resort: "Palm Cove Villa",  dates: "Apr 5–7",      platform: "agoda",   sync: "synced"  },
  { id: 4, guest: "Rico Fernandez", resort: "Sunset Cove",      dates: "Apr 10–12",    platform: "klook",   sync: "pending" },
  { id: 5, guest: "Lea Villanueva", resort: "Coral Bay Resort", dates: "Apr 14–16",    platform: "booking", sync: "synced"  },
  { id: 6, guest: "Mark Uy",        resort: "Blue Lagoon Inn",  dates: "Apr 18–20",    platform: "agoda",   sync: "synced"  },
];

export const RESORTS = [
  { name: "Coral Bay Resort", location: "Cebu, Philippines",     platforms: ["klook","booking","agoda"], bookings: 10, status: "active" },
  { name: "Blue Lagoon Inn",  location: "Palawan, Philippines",  platforms: ["booking","agoda"],         bookings: 7,  status: "active" },
  { name: "Palm Cove Villa",  location: "Boracay, Philippines",  platforms: ["klook"],                  bookings: 4,  status: "setup"  },
  { name: "Sunset Cove",      location: "Siargao, Philippines",  platforms: ["klook","booking"],         bookings: 3,  status: "active" },
  { name: "Casa Isla",        location: "Batangas, Philippines", platforms: ["agoda"],                  bookings: 0,  status: "setup"  },
];

export const PLATFORM_LABELS = { klook: "Klook", booking: "Booking.com", agoda: "Agoda" };

export const TIMEFRAMES = ["All-time","Hourly","Daily","Weekly","Monthly"];
