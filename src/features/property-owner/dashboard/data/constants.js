export const SPARK_DATA = {
  bookings: [40,55,45,70,60,85,75,100],
  resorts:  [50,50,67,67,83,83,100,100],
  earnings: [50,60,55,72,68,80,90,100],
  pending:  [80,60,100,40,80,60,40,25],
};

export const ACTIVITY_BARS = [40,55,35,70,60,80,50,90,65,75,85,100];

export const DEMO_TOTAL_ROOMS = 3;

export const DEMO_BOOKINGS_BY_DATE = {
  "2026-04-03": [
    { id: "b1", guestName: "Maria Santos", roomName: "Deluxe Suite", platform: "klook", checkIn: "2026-04-03", checkOut: "2026-04-06", totalAmount: 4500, commissionAmount: 450, status: "synced" },
  ],
  "2026-04-04": [
    { id: "b1", guestName: "Maria Santos", roomName: "Deluxe Suite", platform: "klook", checkIn: "2026-04-03", checkOut: "2026-04-06", totalAmount: 4500, commissionAmount: 450, status: "synced" },
    { id: "b2", guestName: "Juan dela Cruz", roomName: "Standard Room", platform: "booking", checkIn: "2026-04-04", checkOut: "2026-04-07", totalAmount: 3200, commissionAmount: 320, status: "synced" },
  ],
  "2026-04-05": [
    { id: "b1", guestName: "Maria Santos", roomName: "Deluxe Suite", platform: "klook", checkIn: "2026-04-03", checkOut: "2026-04-06", totalAmount: 4500, commissionAmount: 450, status: "synced" },
    { id: "b2", guestName: "Juan dela Cruz", roomName: "Standard Room", platform: "booking", checkIn: "2026-04-04", checkOut: "2026-04-07", totalAmount: 3200, commissionAmount: 320, status: "synced" },
    { id: "b3", guestName: "Anna Reyes", roomName: "Family Room", platform: "agoda", checkIn: "2026-04-05", checkOut: "2026-04-08", totalAmount: 5800, commissionAmount: 580, status: "synced" },
  ],
  "2026-04-06": [
    { id: "b2", guestName: "Juan dela Cruz", roomName: "Standard Room", platform: "booking", checkIn: "2026-04-04", checkOut: "2026-04-07", totalAmount: 3200, commissionAmount: 320, status: "synced" },
    { id: "b3", guestName: "Anna Reyes", roomName: "Family Room", platform: "agoda", checkIn: "2026-04-05", checkOut: "2026-04-08", totalAmount: 5800, commissionAmount: 580, status: "synced" },
  ],
  "2026-04-07": [
    { id: "b3", guestName: "Anna Reyes", roomName: "Family Room", platform: "agoda", checkIn: "2026-04-05", checkOut: "2026-04-08", totalAmount: 5800, commissionAmount: 580, status: "synced" },
  ],
  "2026-04-12": [
    { id: "b4", guestName: "Rico Fernandez", roomName: "Deluxe Suite", platform: "klook", checkIn: "2026-04-12", checkOut: "2026-04-15", totalAmount: 4500, commissionAmount: 450, status: "synced" },
    { id: "b5", guestName: "Lea Villanueva", roomName: "Standard Room", platform: "booking", checkIn: "2026-04-12", checkOut: "2026-04-14", totalAmount: 2400, commissionAmount: 240, status: "pending" },
  ],
  "2026-04-13": [
    { id: "b4", guestName: "Rico Fernandez", roomName: "Deluxe Suite", platform: "klook", checkIn: "2026-04-12", checkOut: "2026-04-15", totalAmount: 4500, commissionAmount: 450, status: "synced" },
    { id: "b5", guestName: "Lea Villanueva", roomName: "Standard Room", platform: "booking", checkIn: "2026-04-12", checkOut: "2026-04-14", totalAmount: 2400, commissionAmount: 240, status: "pending" },
  ],
  "2026-04-14": [
    { id: "b4", guestName: "Rico Fernandez", roomName: "Deluxe Suite", platform: "klook", checkIn: "2026-04-12", checkOut: "2026-04-15", totalAmount: 4500, commissionAmount: 450, status: "synced" },
  ],
  "2026-04-19": [
    { id: "b6", guestName: "Carlos Tan", roomName: "Deluxe Suite", platform: "agoda", checkIn: "2026-04-19", checkOut: "2026-04-22", totalAmount: 5100, commissionAmount: 510, status: "synced" },
    { id: "b7", guestName: "Sofia Cruz", roomName: "Family Room", platform: "klook", checkIn: "2026-04-19", checkOut: "2026-04-21", totalAmount: 3800, commissionAmount: 380, status: "synced" },
    { id: "b8", guestName: "Marco Reyes", roomName: "Standard Room", platform: "booking", checkIn: "2026-04-19", checkOut: "2026-04-23", totalAmount: 4800, commissionAmount: 480, status: "synced" },
  ],
  "2026-04-20": [
    { id: "b6", guestName: "Carlos Tan", roomName: "Deluxe Suite", platform: "agoda", checkIn: "2026-04-19", checkOut: "2026-04-22", totalAmount: 5100, commissionAmount: 510, status: "synced" },
    { id: "b7", guestName: "Sofia Cruz", roomName: "Family Room", platform: "klook", checkIn: "2026-04-19", checkOut: "2026-04-21", totalAmount: 3800, commissionAmount: 380, status: "synced" },
    { id: "b8", guestName: "Marco Reyes", roomName: "Standard Room", platform: "booking", checkIn: "2026-04-19", checkOut: "2026-04-23", totalAmount: 4800, commissionAmount: 480, status: "synced" },
  ],
  "2026-04-21": [
    { id: "b6", guestName: "Carlos Tan", roomName: "Deluxe Suite", platform: "agoda", checkIn: "2026-04-19", checkOut: "2026-04-22", totalAmount: 5100, commissionAmount: 510, status: "synced" },
    { id: "b8", guestName: "Marco Reyes", roomName: "Standard Room", platform: "booking", checkIn: "2026-04-19", checkOut: "2026-04-23", totalAmount: 4800, commissionAmount: 480, status: "synced" },
  ],
  "2026-04-22": [
    { id: "b8", guestName: "Marco Reyes", roomName: "Standard Room", platform: "booking", checkIn: "2026-04-19", checkOut: "2026-04-23", totalAmount: 4800, commissionAmount: 480, status: "synced" },
  ],
  "2026-04-26": [
    { id: "b9", guestName: "Diana Lopez", roomName: "Family Room", platform: "klook", checkIn: "2026-04-26", checkOut: "2026-04-29", totalAmount: 5400, commissionAmount: 540, status: "pending" },
  ],
  "2026-04-27": [
    { id: "b9", guestName: "Diana Lopez", roomName: "Family Room", platform: "klook", checkIn: "2026-04-26", checkOut: "2026-04-29", totalAmount: 5400, commissionAmount: 540, status: "pending" },
  ],
  "2026-04-28": [
    { id: "b9", guestName: "Diana Lopez", roomName: "Family Room", platform: "klook", checkIn: "2026-04-26", checkOut: "2026-04-29", totalAmount: 5400, commissionAmount: 540, status: "pending" },
  ],
};
