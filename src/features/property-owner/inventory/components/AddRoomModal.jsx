import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RESORTS } from "@/data/constants";

export const AddRoomModal = ({ open, onOpenChange, onSave }) => {
  const [resort, setResort] = useState("");
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [baseMinStay, setBaseMinStay] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!resort || !name || !basePrice || !baseMinStay) return;

    const newRoom = {
      id: `r-${Math.floor(Math.random() * 10000)}`,
      resort,
      name,
      basePrice: parseInt(basePrice, 10),
      baseMinStay: parseInt(baseMinStay, 10),
    };

    onSave(newRoom);
    onOpenChange(false);
    
    // Reset
    setResort("");
    setName("");
    setBasePrice("");
    setBaseMinStay("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/20 text-foreground sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Room</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground/80 mb-1 block">Property / Resort</label>
              <Select value={resort} onValueChange={setResort}>
                <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown border-white/30">
                  {RESORTS.map(r => <SelectItem key={r.name} value={r.name} className="text-sm rounded-lg">{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground/80 mb-1 block">Room Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white/40 dark:bg-black/20 border border-white/20 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                placeholder="e.g. Deluxe Ocean View Suite"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground/80 mb-1 block">Base Price (₱)</label>
                <input 
                  type="number" 
                  value={basePrice}
                  onChange={e => setBasePrice(e.target.value)}
                  className="w-full bg-white/40 dark:bg-black/20 border border-white/20 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                  placeholder="e.g. 5000"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground/80 mb-1 block">Base Min Stay (Nights)</label>
                <input 
                  type="number" 
                  value={baseMinStay}
                  onChange={e => setBaseMinStay(e.target.value)}
                  className="w-full bg-white/40 dark:bg-black/20 border border-white/20 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                  placeholder="e.g. 1"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-md shadow-green-500/20">
            Create Room
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
