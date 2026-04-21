Create a new **Connections** page for YadoManagement. This is a dedicated page accessible from the sidebar navigation where property owners manage their Beds24 API key and connect/disconnect their OTA platform accounts.

---

## Sidebar Update

Add "Connections" as a new nav item in the sidebar between Earnings and Settings:

```
MENU
  Overview
  Bookings
  Earnings
  Connections    ← new
SUPPORT
  Settings
```

- Icon: use a globe or link icon from lucide-react (`Globe` or `Link2`)
- Show a badge on the nav item displaying the number of currently connected platforms
- Badge updates dynamically based on real data from `platform_connections` table
- Route: `/dashboard/connections`

---

## Page Location
`src/features/property-owner/connections/ui/ConnectionsPage.jsx`

Also create:
- `src/features/property-owner/connections/queries/index.js` — Supabase queries
- `src/features/property-owner/connections/hooks/useConnections.js` — React Query hooks

---

## Page Layout

### Topbar
- Title: "Connections"
- Right side: a small status pill showing Beds24 connection status
  - If connected: green dot + "Beds24 connected"
  - If not connected: amber dot + "Beds24 not connected"
  - Background: `#f0faf0`, border: `0.5px solid #97C459`, text: `#27500A` when connected
  - Background: warning colors when not connected

### Page Description
Small muted paragraph below the topbar:
> "Connect your OTA platform accounts to YadoManagement. Once connected, bookings from each platform will be synced automatically in real time."


## Section 1: OTA Platforms

Section title: "OTA Platforms"
Section subtitle: "Connect the platforms where your property is listed."

### Platform Cards

One card per platform. Supported platforms: **Booking.com, Agoda, Airbnb, Traveloka, and all possible OTA Platforms**

**Connected card:**
- Green left border (`border-left: 3px solid #3aab4a`)
- Platform logo placeholder (colored square with platform initials — BK, AG, AB, TV)
- Platform name in bold
- Green dot + "Connected" status text
- Small muted text: "Property ID: {external_property_id} · Last synced {time ago}"
- "Disconnect" button (outlined, muted) on the right

**Disconnected card:**
- Muted gray left border
- Platform name in bold
- Gray dot + "Not connected" status text
- Small muted text: "Connect your {platform} account via Beds24"
- "+ Connect" button (green, solid) on the right

---

## Connect Flow (on "+ Connect" click)

When a property owner clicks "+ Connect" on a platform:

1. Show a small inline modal or expandable section below the card:
   ```
   Enter your {Platform} Property ID from Beds24:
   [ Property ID input field        ] [ Connect ]
   
   How to find your Property ID →  (link to help text)
   ```

2. On submit:
   - Call `channelManager.syncProperty(propertyId)` to verify the connection works
   - If success → insert row into `platform_connections` table:
     ```js
     await supabase.from('platform_connections').insert({
       property_id: propertyId,
       platform: 'booking', // or 'agoda', 'airbnb', 'traveloka'
       external_property_id: enteredPropertyId,
       connection_status: 'connected',
       connected_at: new Date().toISOString(),
     })
     ```
   - Show success toast: "{Platform} connected successfully"
   - Update the card to show connected state
   - Update the sidebar badge count

3. If connection fails:
   - Show error toast: "Could not connect — please check your Property ID"
   - Keep the card in disconnected state

---

## Disconnect Flow (on "Disconnect" click)

1. Show a confirmation using shadcn/ui `AlertDialog`:
   - Title: "Disconnect {Platform}?"
   - Description: "Bookings from {Platform} will no longer sync. You can reconnect at any time."
   - Cancel and Confirm buttons

2. On confirm:
   - Update `platform_connections` table:
     ```js
     await supabase
       .from('platform_connections')
       .update({ connection_status: 'disconnected' })
       .eq('property_id', propertyId)
       .eq('platform', platform)
     ```
   - Show success toast: "{Platform} disconnected"
   - Update card to disconnected state
   - Update sidebar badge count

---

## Data Fetching

### useConnections hook
```js
export const useConnections = (propertyId) => {
  return useQuery({
    queryKey: ['connections', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('property_id', propertyId)

      if (error) throw error
      return data
    },
    enabled: !!propertyId,
  })
}


---

## Platform Colors (for logo placeholders)

| Platform | Background | Text | Initials |
|---|---|---|---|
| Booking.com | `#003580` | `#fff` | BK |
| Agoda | `#e61e28` | `#fff` | AG |
| Airbnb | `#ff5a5f` | `#fff` | AB |
| Traveloka | `#0064d2` | `#fff` | TV |

and more

To be replaced with real logos, I will add it later

---

## Notes
- Use shadcn/ui `Card`, `Button`, `Input`, `AlertDialog`, `Toast` components throughout
- Use lucide-react icons: `Globe` or `Link2` for sidebar, `CheckCircle` for verified, `AlertCircle` for warnings
- Use React Query `useMutation` for connect/disconnect/update key actions with `invalidateQueries` on success
- All API calls go through `channelManager.js` — never call Beds24 directly from this page
- Follow existing conventions: JavaScript, camelCase, named exports for components, default export for page
- Tailwind only — no inline styles