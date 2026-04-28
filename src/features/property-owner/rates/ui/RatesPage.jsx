import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RESORTS, INITIAL_RATE_OVERRIDES } from "@/data/constants";
import { RateGrid } from "../components/RateGrid";
import { BulkUpdateModal } from "../components/BulkUpdateModal";
import { Button } from "@/components/ui/button";
import { TrendingUp, PencilRuler } from "lucide-react";

export const RatesPage = () => {
  const [resort, setResort] = useState("all");
  const [rateOverrides, setRateOverrides] = useState(INITIAL_RATE_OVERRIDES);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBulkUpdate = (newOverrides) => {
    setRateOverrides(prev => {
      // Filter out any existing overrides for the same room and date
      const filteredPrev = prev.filter(o => 
        !newOverrides.some(newO => newO.roomId === o.roomId && newO.date === o.date)
      );
      return [...filteredPrev, ...newOverrides];
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header & Filters */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground/90 leading-tight">Rates & Yield</h2>
            <p className="text-xs text-muted-foreground/60">Manage daily pricing and availability rules</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={resort} onValueChange={setResort}>
            <SelectTrigger className="h-9 text-xs w-40 glass-filter-btn rounded-xl border-0">
              <SelectValue placeholder="Resort: All" />
            </SelectTrigger>
            <SelectContent className="glass-dropdown rounded-xl border-white/30">
              <SelectItem value="all" className="text-xs rounded-lg">Resort: All</SelectItem>
              {RESORTS.map(r => <SelectItem key={r.name} value={r.name} className="text-xs rounded-lg">{r.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-md shadow-green-500/20 h-9 px-4 flex items-center gap-2 transition-all"
          >
            <PencilRuler className="w-4 h-4" />
            <span className="text-sm font-semibold">Bulk Update</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        <RateGrid selectedResort={resort} rateOverrides={rateOverrides} />
      </div>

      {/* Modals */}
      <BulkUpdateModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onSave={handleBulkUpdate} 
      />
    </div>
  );
};
