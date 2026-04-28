import { useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RESORTS, ROOMS } from "@/data/constants";

export const AddBookingModal = ({ open, onOpenChange, onSave }) => {
  const [type, setType] = useState("direct"); // "direct" | "maintenance"
  const [resort, setResort] = useState("");
  const [roomId, setRoomId] = useState("");
  const [guest, setGuest] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const filteredRooms = ROOMS.filter(r => r.resort === resort);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!resort || !roomId || !checkIn || !checkOut || (type === "direct" && !guest)) {
      return; // Basic validation
    }

    const newBooking = {
      id: Math.floor(Math.random() * 10000),
      guest: type === "maintenance" ? "Maintenance Block" : guest,
      resort,
      roomId,
      checkIn,
      checkOut,
      dates: `${format(new Date(checkIn), "MMM d")}–${format(new Date(checkOut), "d")}`,
      platform: "direct",
      sync: "pending"
    };

    onSave(newBooking);
    onOpenChange(false);
    
    // Reset form
    setGuest("");
    setCheckIn("");
    setCheckOut("");
    setRoomId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/20 text-foreground sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Manual Block</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          
          {/* Type Toggle */}
          <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl border border-white/10">
            <button 
              type="button"
              onClick={() => setType("direct")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${type === "direct" ? "bg-white dark:bg-white/10 shadow-sm" : "text-muted-foreground/60 hover:text-foreground"}`}
            >
              Direct Booking
            </button>
            <button 
              type="button"
              onClick={() => setType("maintenance")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${type === "maintenance" ? "bg-white dark:bg-white/10 shadow-sm" : "text-muted-foreground/60 hover:text-foreground"}`}
            >
              Maintenance
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground/80 mb-1 block">Resort</label>
              <Select value={resort} onValueChange={(val) => { setResort(val); setRoomId(""); }}>
                <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                  <SelectValue placeholder="Select a resort" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown border-white/30">
                  {RESORTS.map(r => <SelectItem key={r.name} value={r.name} className="text-sm rounded-lg">{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground/80 mb-1 block">Room / Unit</label>
              <Select value={roomId} onValueChange={setRoomId} disabled={!resort}>
                <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown border-white/30">
                  {filteredRooms.map(r => <SelectItem key={r.id} value={r.id} className="text-sm rounded-lg">{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {type === "direct" && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground/80 mb-1 block">Guest Name</label>
                <input 
                  type="text" 
                  value={guest} 
                  onChange={e => setGuest(e.target.value)}
                  className="w-full bg-white/40 dark:bg-black/20 border border-white/20 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                  placeholder="e.g. John Doe"
                  required={type === "direct"}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground/80 mb-1 block">Check In</label>
                <input 
                  type="date" 
                  value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                  className="w-full bg-white/40 dark:bg-black/20 border border-white/20 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground/80 mb-1 block">Check Out</label>
                <input 
                  type="date" 
                  value={checkOut}
                  onChange={e => setCheckOut(e.target.value)}
                  className="w-full bg-white/40 dark:bg-black/20 border border-white/20 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-md shadow-green-500/20">
            {type === "direct" ? "Add Direct Booking" : "Block Dates"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
