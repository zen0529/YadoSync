import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RESORTS, ROOMS } from "@/data/constants";
import { eachDayOfInterval, format, parseISO } from "date-fns";

export const BulkUpdateModal = ({ open, onOpenChange, onSave }) => {
  const [resort, setResort] = useState("");
  const [roomId, setRoomId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
  const [minStay, setMinStay] = useState("");

  const filteredRooms = ROOMS.filter(r => r.resort === resort);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!resort || !roomId || !startDate || !endDate || !price) {
      return;
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    if (start > end) return;

    const days = eachDayOfInterval({ start, end });
    const newOverrides = days.map(day => ({
      roomId,
      date: format(day, "yyyy-MM-dd"),
      price: parseInt(price, 10),
      minStay: minStay ? parseInt(minStay, 10) : 1
    }));

    onSave(newOverrides);
    onOpenChange(false);
    
    // Reset form
    setResort("");
    setRoomId("");
    setStartDate("");
    setEndDate("");
    setPrice("");
    setMinStay("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/20 text-foreground sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Bulk Update Rates</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground/80 mb-1 block">Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-white/40 dark:bg-black/20 border border-white/20 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground/80 mb-1 block">End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-white/40 dark:bg-black/20 border border-white/20 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground/80 mb-1 block">New Price (₱)</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full bg-white/40 dark:bg-black/20 border border-white/20 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                  placeholder="e.g. 6000"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground/80 mb-1 block">Min Stay (Nights)</label>
                <input 
                  type="number" 
                  value={minStay}
                  onChange={e => setMinStay(e.target.value)}
                  className="w-full bg-white/40 dark:bg-black/20 border border-white/20 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                  placeholder="e.g. 2"
                  min="1"
                />
              </div>
            </div>

          </div>

          <Button type="submit" className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-md shadow-green-500/20">
            Apply Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
