import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RESORTS, TIMEFRAMES } from "@/data/constants";
import { useAuth } from "@/features/auth/context/AuthContext";

const NAV_ITEMS = [
  { id: "overview",  label: "Overview",  icon: "⊞" },
  { id: "bookings",  label: "Bookings",  icon: "📋" },
  { id: "resorts",   label: "Resorts",   icon: "🏝️" },
  { id: "earnings",  label: "Earnings",  icon: "₱" },
];

export const DashboardLayout = () => {
  const { user, signOut } = useAuth();
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "User";
  const location = useLocation();
  const page = location.pathname.split("/")[1] || "overview";
  const [timeframe, setTimeframe]         = useState("All-time");
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateFrom, setDateFrom]           = useState("");
  const [dateTo, setDateTo]               = useState("");

  return (
    <div className="flex h-screen overflow-hidden bg-[#e8e8e8] font-sans">

      {/* SIDEBAR */}
      <aside className="w-[220px] flex-shrink-0 bg-white border-r border-black/8 flex flex-col">
        <div className="px-5 py-5 border-b border-black/7">
          <p className="text-lg font-extrabold text-green-600 tracking-wide">YadoBooking</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Channel Manager</p>
        </div>

        <nav className="px-3 pt-5 flex-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2">Menu</p>
          {NAV_ITEMS.map(n => (
            <Link key={n.id} to={`/${n.id}`}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-all
                ${page === n.id ? "bg-green-50 text-green-600 font-semibold" : "text-muted-foreground hover:bg-green-50/60 hover:text-green-600"}`}>
              <span className="w-4 text-center text-sm">{n.icon}</span>
              {n.label}
            </Link>
          ))}
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2 mt-4">Support</p>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 transition-all">
            <span className="w-4 text-center">⚙</span> Settings
          </button>
        </nav>

        <div className="px-4 py-4 border-t border-black/7 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-600 flex-shrink-0">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{username}</p>
            <button onClick={signOut} className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOPBAR */}
        <header className="h-14 bg-white border-b border-black/8 px-6 flex items-center justify-between flex-shrink-0">
          <h1 className="text-lg font-bold">{NAV_ITEMS.find(n => n.id === page)?.label}</h1>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-muted-foreground">Timeframe: {timeframe}</span>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs">↓ Export</Button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* FILTERS */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <div className="flex bg-white border border-black/8 rounded-lg overflow-hidden">
              {TIMEFRAMES.map((t, i) => (
                <div key={t} className="flex items-center">
                  {i > 0 && <div className="w-px bg-black/7 my-1.5" />}
                  <button onClick={() => { setTimeframe(t); setShowDateRange(false); }}
                    className={`px-3.5 py-1.5 text-xs font-medium transition-all
                      ${timeframe === t ? "bg-green-600 text-white font-semibold" : "text-muted-foreground hover:text-green-600 hover:bg-green-50"}`}>
                    {t}
                  </button>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" className="h-8 text-xs border-black/8"
              onClick={() => { setShowDateRange(v => !v); if (!showDateRange) setTimeframe("Custom range"); }}>
              📅 Date Range
            </Button>

            {showDateRange && (
              <div className="flex items-center gap-2 bg-white border border-black/8 rounded-lg px-3 py-1.5">
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="bg-transparent border-none text-xs text-foreground outline-none w-28 cursor-pointer" />
                <span className="text-muted-foreground text-xs">→</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="bg-transparent border-none text-xs text-foreground outline-none w-28 cursor-pointer" />
              </div>
            )}

            <Select>
              <SelectTrigger className="h-8 text-xs w-36 border-black/8 bg-white">
                <SelectValue placeholder="Platform: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Platform: All</SelectItem>
                <SelectItem value="klook" className="text-xs">Klook</SelectItem>
                <SelectItem value="booking" className="text-xs">Booking.com</SelectItem>
                <SelectItem value="agoda" className="text-xs">Agoda</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="h-8 text-xs w-40 border-black/8 bg-white">
                <SelectValue placeholder="Resort: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Resort: All</SelectItem>
                {RESORTS.map(r => (
                  <SelectItem key={r.name} value={r.name} className="text-xs">{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PAGES */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};
