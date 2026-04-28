import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RESORTS, ROOMS } from "@/data/constants";
import { AddRoomModal } from "../components/AddRoomModal";
import { ImportOtaModal } from "../components/ImportOtaModal";
import { BedDouble, Plus, Download, ChevronRight } from "lucide-react";

export const InventoryPage = () => {
  const [resortFilter, setResortFilter] = useState("all");
  const [roomsList, setRoomsList] = useState(ROOMS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleAddRoom = (newRoom) => {
    setRoomsList(prev => [...prev, newRoom]);
  };

  const handleImportRooms = (importedRooms) => {
    setRoomsList(prev => [...prev, ...importedRooms]);
  };

  // Group rooms by resort
  const groupedRooms = useMemo(() => {
    const filtered = roomsList.filter(r => resortFilter === "all" || r.resort === resortFilter);
    const groups = {};
    filtered.forEach(r => {
      if (!groups[r.resort]) groups[r.resort] = [];
      groups[r.resort].push(r);
    });
    return groups;
  }, [roomsList, resortFilter]);

  return (
    <div className="flex flex-col h-full">
      {/* Header & Filters */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20">
            <BedDouble className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground/90 leading-tight">Rooms & Inventory</h2>
            <p className="text-xs text-muted-foreground/60">Configure your physical room types and capacities</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={resortFilter} onValueChange={setResortFilter}>
            <SelectTrigger className="h-9 text-xs w-40 glass-filter-btn rounded-xl border-0">
              <SelectValue placeholder="Resort: All" />
            </SelectTrigger>
            <SelectContent className="glass-dropdown rounded-xl border-white/30">
              <SelectItem value="all" className="text-xs rounded-lg">Resort: All</SelectItem>
              {RESORTS.map(r => <SelectItem key={r.name} value={r.name} className="text-xs rounded-lg">{r.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button 
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-foreground border border-white/20 rounded-xl h-9 px-4 flex items-center gap-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-semibold hidden sm:inline">Import from OTA</span>
          </Button>

          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-md shadow-green-500/20 h-9 px-4 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-semibold hidden sm:inline">Create Manually</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto custom-scrollbar pb-6">
        {Object.keys(groupedRooms).length === 0 ? (
          <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20 px-6 mt-4">
            <div className="w-14 h-14 rounded-full bg-green-100/60 flex items-center justify-center mb-4">
              <BedDouble className="w-7 h-7 text-green-500/50" />
            </div>
            <p className="text-base font-semibold text-foreground/60 mb-1">No rooms configured</p>
            <p className="text-sm text-muted-foreground/60 mb-5 text-center max-w-xs">Start by importing from your connected OTAs or creating them manually.</p>
            <Button className="bg-green-500/90 hover:bg-green-600 text-white text-xs h-8 rounded-lg shadow-md shadow-green-500/20" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Create your first room
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedRooms).map(([resortName, rooms]) => (
              <div key={resortName} className="space-y-3">
                <h3 className="text-sm font-bold text-foreground/80 px-1 border-b border-white/10 pb-2">{resortName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {rooms.map(room => (
                    <div key={room.id} className="glass-card rounded-2xl p-5 hover:bg-white/30 transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-foreground/90 text-base">{room.name}</h4>
                          <p className="text-xs text-muted-foreground/60 mt-0.5">ID: {room.id}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-green-500/10 group-hover:text-green-600 transition-colors">
                          <ChevronRight className="w-4 h-4 text-foreground/40 group-hover:text-green-600" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 border-t border-white/10 pt-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-0.5">Base Price</p>
                          <p className="text-sm font-bold text-foreground/80">₱{room.basePrice?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-0.5">Min Stay</p>
                          <p className="text-sm font-medium text-foreground/80">{room.baseMinStay} Nights</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add New Room Card */}
                  <div 
                    onClick={() => { setResortFilter(resortName); setIsModalOpen(true); }}
                    className="rounded-2xl border-2 border-dashed border-green-300/40 hover:border-green-400/60 hover:bg-green-50/20 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px]"
                  >
                    <Plus className="w-6 h-6 text-green-500/60 mb-2" />
                    <span className="text-xs font-semibold text-green-600/80">Add another room</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddRoomModal open={isModalOpen} onOpenChange={setIsModalOpen} onSave={handleAddRoom} />
      <ImportOtaModal open={isImportModalOpen} onOpenChange={setIsImportModalOpen} onImport={handleImportRooms} />
    </div>
  );
};
