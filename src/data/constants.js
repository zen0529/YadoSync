export const ROOMS = [
  { id: "r1", resort: "Coral Bay Resort", name: "Ocean Villa 1", basePrice: 5000, baseMinStay: 1 },
  { id: "r2", resort: "Coral Bay Resort", name: "Ocean Villa 2", basePrice: 5000, baseMinStay: 1 },
  { id: "r3", resort: "Coral Bay Resort", name: "Standard Room", basePrice: 3500, baseMinStay: 1 },
  { id: "r4", resort: "Blue Lagoon Inn",  name: "Lagoon Suite", basePrice: 4200, baseMinStay: 2 },
  { id: "r5", resort: "Blue Lagoon Inn",  name: "Deluxe Double", basePrice: 3800, baseMinStay: 1 },
  { id: "r6", resort: "Palm Cove Villa",  name: "Entire Villa", basePrice: 12000, baseMinStay: 3 },
  { id: "r7", resort: "Sunset Cove",      name: "Beachfront Cabin", basePrice: 6500, baseMinStay: 2 },
];

export const BOOKINGS = [
  { id: 1, guest: "Maria Santos",   resort: "Coral Bay Resort", roomId: "r1", checkIn: "2026-03-28", checkOut: "2026-03-30", dates: "Mar 28–29",    platform: "klook",   sync: "synced"  },
  { id: 2, guest: "Juan dela Cruz", resort: "Blue Lagoon Inn",  roomId: "r4", checkIn: "2026-03-30", checkOut: "2026-04-03", dates: "Mar 30–Apr 2", platform: "booking", sync: "pending" },
  { id: 3, guest: "Anna Reyes",     resort: "Palm Cove Villa",  roomId: "r6", checkIn: "2026-04-05", checkOut: "2026-04-08", dates: "Apr 5–7",      platform: "agoda",   sync: "synced"  },
  { id: 4, guest: "Rico Fernandez", resort: "Sunset Cove",      roomId: "r7", checkIn: "2026-04-10", checkOut: "2026-04-13", dates: "Apr 10–12",    platform: "klook",   sync: "pending" },
  { id: 5, guest: "Lea Villanueva", resort: "Coral Bay Resort", roomId: "r2", checkIn: "2026-04-14", checkOut: "2026-04-17", dates: "Apr 14–16",    platform: "booking", sync: "synced"  },
  { id: 6, guest: "Mark Uy",        resort: "Blue Lagoon Inn",  roomId: "r5", checkIn: "2026-04-18", checkOut: "2026-04-21", dates: "Apr 18–20",    platform: "agoda",   sync: "synced"  },
];

export const RESORTS = [
  { name: "Coral Bay Resort", location: "Cebu, Philippines",     platforms: ["klook","booking","agoda"], bookings: 10, status: "active" },
  { name: "Blue Lagoon Inn",  location: "Palawan, Philippines",  platforms: ["booking","agoda"],         bookings: 7,  status: "active" },
  { name: "Palm Cove Villa",  location: "Boracay, Philippines",  platforms: ["klook"],                  bookings: 4,  status: "setup"  },
  { name: "Sunset Cove",      location: "Siargao, Philippines",  platforms: ["klook","booking"],         bookings: 3,  status: "active" },
  { name: "Casa Isla",        location: "Batangas, Philippines", platforms: ["agoda"],                  bookings: 0,  status: "setup"  },
];

export const PLATFORM_LABELS = { klook: "Klook", booking: "Booking.com", agoda: "Agoda" };

export const TIMEFRAMES = ["All-time","Today","This week","This month","Last 30 days"];

export const INITIAL_RATE_OVERRIDES = [
  { roomId: "r1", date: "2026-04-04", price: 6000, minStay: 2 },
  { roomId: "r1", date: "2026-04-05", price: 6000, minStay: 2 },
  { roomId: "r2", date: "2026-04-04", price: 6000, minStay: 2 },
  { roomId: "r2", date: "2026-04-05", price: 6000, minStay: 2 },
];

export const MOCK_CONVERSATIONS = [
  { id: "c1", guest: "Maria Santos", platform: "klook", resort: "Coral Bay Resort", unread: true, lastMessageAt: "2026-03-25T10:30:00Z", snippet: "Hi, can we request an early check-in around 11 AM?" },
  { id: "c2", guest: "Juan dela Cruz", platform: "booking", resort: "Blue Lagoon Inn", unread: false, lastMessageAt: "2026-03-24T15:45:00Z", snippet: "Thank you, we will see you on the 30th!" },
  { id: "c3", guest: "Anna Reyes", platform: "agoda", resort: "Palm Cove Villa", unread: false, lastMessageAt: "2026-03-20T09:15:00Z", snippet: "Does the villa have a private pool?" },
];

export const MOCK_MESSAGES = {
  c1: [
    { id: "m1", sender: "guest", text: "Hello! We are excited for our stay.", timestamp: "2026-03-25T10:00:00Z" },
    { id: "m2", sender: "host", text: "Hi Maria! We are excited to host you. Let us know if you have any special requests.", timestamp: "2026-03-25T10:15:00Z" },
    { id: "m3", sender: "guest", text: "Hi, can we request an early check-in around 11 AM?", timestamp: "2026-03-25T10:30:00Z" },
  ],
  c2: [
    { id: "m4", sender: "guest", text: "Hi, do you offer airport pickup?", timestamp: "2026-03-24T14:00:00Z" },
    { id: "m5", sender: "host", text: "Hello Juan! Yes, we offer airport pickup for ₱800. Shall I arrange it for you?", timestamp: "2026-03-24T14:30:00Z" },
    { id: "m6", sender: "guest", text: "Yes please, our flight arrives at 2 PM.", timestamp: "2026-03-24T15:00:00Z" },
    { id: "m7", sender: "host", text: "Noted! Our driver will wait at the arrival area holding a sign with your name.", timestamp: "2026-03-24T15:10:00Z" },
    { id: "m8", sender: "guest", text: "Thank you, we will see you on the 30th!", timestamp: "2026-03-24T15:45:00Z" },
  ],
  c3: [
    { id: "m9", sender: "guest", text: "Does the villa have a private pool?", timestamp: "2026-03-20T09:15:00Z" },
  ]
};

export const MOCK_REVENUE_DATA = [
  { name: "Mon", revenue: 15000, bookings: 4 },
  { name: "Tue", revenue: 12000, bookings: 3 },
  { name: "Wed", revenue: 18000, bookings: 5 },
  { name: "Thu", revenue: 22000, bookings: 7 },
  { name: "Fri", revenue: 45000, bookings: 12 },
  { name: "Sat", revenue: 52000, bookings: 14 },
  { name: "Sun", revenue: 38000, bookings: 9 },
];

export const MOCK_PLATFORM_DATA = [
  { name: "Booking.com", value: 45, fill: "#003580" },
  { name: "Agoda", value: 30, fill: "#ff567d" },
  { name: "Klook", value: 15, fill: "#ff5a00" },
  { name: "Direct", value: 10, fill: "#22c55e" },
];

export const EARNINGS_PER_RESORT = [
  { resort: "Coral Bay Resort", amount: 6800 },
  { resort: "Blue Lagoon Inn",  amount: 4900 },
  { resort: "Palm Cove Villa",  amount: 3200 },
  { resort: "Sunset Cove",      amount: 2100 },
  { resort: "Casa Isla",        amount: 1400 },
];

export const EARNINGS_PER_BOOKING = [
  { guest: "Maria Santos",   resort: "Coral Bay Resort", platform: "klook",   amount: 1200 },
  { guest: "Juan dela Cruz", resort: "Blue Lagoon Inn",  platform: "booking", amount: 980  },
  { guest: "Anna Reyes",     resort: "Palm Cove Villa",  platform: "agoda",   amount: 750  },
  { guest: "Rico Fernandez", resort: "Sunset Cove",      platform: "klook",   amount: 640  },
  { guest: "Lea Villanueva", resort: "Coral Bay Resort", platform: "booking", amount: 1050 },
];

export const MOCK_ARRIVALS = [
  { id: "a1", guest: "Sophie Turner", resort: "Coral Bay Resort", room: "Ocean Villa 1", time: "14:00", platform: "booking" },
  { id: "a2", guest: "Liam Smith",    resort: "Blue Lagoon Inn",  room: "Lagoon Suite",  time: "15:30", platform: "agoda" },
];

export const MOCK_DEPARTURES = [
  { id: "d1", guest: "Emma Davis",    resort: "Coral Bay Resort", room: "Standard Room", time: "11:00", platform: "klook" },
  { id: "d2", guest: "Noah Wilson",   resort: "Sunset Cove",      room: "Beach Cabin",   time: "12:00", platform: "direct" },
];

export const MOCK_SUPERADMIN_EARNINGS = [
  { name: "Mon", earnings: 4500, properties: 42 },
  { name: "Tue", earnings: 5200, properties: 42 },
  { name: "Wed", earnings: 4800, properties: 43 },
  { name: "Thu", earnings: 6100, properties: 43 },
  { name: "Fri", earnings: 7500, properties: 45 },
  { name: "Sat", earnings: 8200, properties: 45 },
  { name: "Sun", earnings: 8900, properties: 45 },
];

export const MOCK_SUPERADMIN_PROPERTY_BREAKDOWN = [
  { name: "Coral Bay Resort", value: 35, fill: "#22c55e" },
  { name: "Blue Lagoon Inn", value: 25, fill: "#3b82f6" },
  { name: "Sunset Cove", value: 20, fill: "#8b5cf6" },
  { name: "Palm Cove Villa", value: 15, fill: "#f59e0b" },
  { name: "Casa Isla", value: 5, fill: "#ef4444" },
];

export const MOCK_SUPERADMIN_ALERTS = [
  { id: 1, type: "error", title: "Agoda Sync Failed", desc: "API connection lost for 3 properties. Re-authentication required." },
  { id: 2, type: "warning", title: "Commission Cap Reached", desc: "Coral Bay Resort reached their ₱50k commission cap for this month." },
  { id: 3, type: "info", title: "New Property Joined", desc: "Sea Breeze Hotel has completed onboarding." },
];

export const MOCK_SUPERADMIN_BILLING = [
  { id: "b1", property: "Coral Bay Resort", owner: "Emma Davis", volume: 154000, commission: 50000, cap: 50000, status: "capped", lastPayment: "2026-04-15" },
  { id: "b2", property: "Blue Lagoon Inn", owner: "Noah Wilson", volume: 85000, commission: 17000, cap: 50000, status: "collecting", lastPayment: "2026-04-01" },
  { id: "b3", property: "Sunset Cove", owner: "Liam Smith", volume: 210000, commission: 42000, cap: 50000, status: "collecting", lastPayment: "2026-04-10" },
  { id: "b4", property: "Palm Cove Villa", owner: "Olivia Jones", volume: 45000, commission: 9000, cap: 50000, status: "overdue", lastPayment: "2026-03-01" },
];

export const MOCK_SUPERADMIN_LOGS = [
  { id: "L1023", time: "10:24 AM", type: "webhook", source: "Booking.com", status: "success", message: "Received modified booking RT-5920" },
  { id: "L1022", time: "10:15 AM", type: "sync", source: "Channex API", status: "failed", message: "Timeout updating inventory for Casa Isla" },
  { id: "L1021", time: "09:45 AM", type: "auth", source: "System", status: "success", message: "Admin user logged in" },
  { id: "L1020", time: "09:30 AM", type: "webhook", source: "Agoda", status: "success", message: "New booking AG-1002 mapped to Palm Cove Villa" },
  { id: "L1019", time: "08:15 AM", type: "sync", source: "Channex API", status: "success", message: "Daily rate push completed for 45 properties" },
];

export const MOCK_ADMIN_PROPERTIES = [
  { id: "p1", name: "Coral Bay Resort", location: "Palawan", ownerName: "Emma Davis", ownerEmail: "emma@coralbay.com", platforms: ["booking", "agoda", "klook"], bookingCount: 142, commissionRate: 20, status: "active" },
  { id: "p2", name: "Blue Lagoon Inn", location: "Boracay", ownerName: "Noah Wilson", ownerEmail: "noah@bluelagoon.com", platforms: ["booking"], bookingCount: 45, commissionRate: 20, status: "active" },
  { id: "p3", name: "Sunset Cove", location: "Siargao", ownerName: "Liam Smith", ownerEmail: "liam@sunsetcove.com", platforms: ["agoda", "klook"], bookingCount: 89, commissionRate: 20, status: "setup" },
  { id: "p4", name: "Palm Cove Villa", location: "Cebu", ownerName: "Olivia Jones", ownerEmail: "olivia@palmcove.com", platforms: ["booking", "agoda"], bookingCount: 12, commissionRate: 20, status: "suspended" },
];

export const MOCK_PROPERTY_LEDGER = [
  { id: "bk-101", guest: "John Doe", platform: "booking", date: "2026-04-20", checkIn: "2026-05-01", checkOut: "2026-05-05", volume: 15000, commission: 3000 },
  { id: "bk-102", guest: "Jane Smith", platform: "agoda", date: "2026-04-21", checkIn: "2026-05-10", checkOut: "2026-05-12", volume: 8000, commission: 1600 },
  { id: "bk-103", guest: "Michael Johnson", platform: "klook", date: "2026-04-22", checkIn: "2026-06-01", checkOut: "2026-06-03", volume: 12000, commission: 2400 },
  { id: "bk-104", guest: "Sarah Williams", platform: "booking", date: "2026-04-23", checkIn: "2026-05-15", checkOut: "2026-05-18", volume: 20000, commission: 4000 },
  { id: "bk-105", guest: "David Brown", platform: "direct", date: "2026-04-24", checkIn: "2026-05-20", checkOut: "2026-05-22", volume: 10000, commission: 2000 },
  { id: "bk-106", guest: "Emily Davis", platform: "agoda", date: "2026-04-25", checkIn: "2026-06-10", checkOut: "2026-06-15", volume: 25000, commission: 5000 },
];
