import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/PlatformBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { getProperties } from "../queries";
import { AddResortModal } from "./AddResortModal";
import { ResortDetailModal } from "./ResortDetailModal";
import { Building2, Plus, Loader2 } from "lucide-react";

export const ResortsPage = () => {
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedResort, setSelectedResort] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadResorts = async () => {
    setLoading(true);
    const data = await getProperties();
    setResorts(data);
    setLoading(false);
  };

  useEffect(() => { loadResorts(); }, []);

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button className="bg-green-500/90 hover:bg-green-600 text-white text-xs h-8 rounded-lg shadow-md shadow-green-500/20 backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:shadow-green-500/30" onClick={() => setModalOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add resort
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-green-500/60 mb-3" />
          <p className="text-sm text-muted-foreground/60">Loading resorts...</p>
        </div>
      ) : resorts.length === 0 ? (
        <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20 px-6">
          <div className="w-14 h-14 rounded-full bg-green-100/60 flex items-center justify-center mb-4">
            <Building2 className="w-7 h-7 text-green-500/50" />
          </div>
          <p className="text-base font-semibold text-foreground/60 mb-1">No properties yet</p>
          <p className="text-sm text-muted-foreground/60 mb-5 text-center max-w-xs">Add your first property to start managing bookings across platforms.</p>
          <Button className="bg-green-500/90 hover:bg-green-600 text-white text-xs h-8 rounded-lg shadow-md shadow-green-500/20" onClick={() => setModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add your first property
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {resorts.map(r => (
            <div
              key={r.id}
              className="glass-card rounded-2xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer hover:shadow-lg"
              onClick={() => { setSelectedResort(r); setDetailOpen(true); }}
              role="button"
              tabIndex={0}
              aria-label={`View details for ${r.name}`}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedResort(r); setDetailOpen(true); } }}
            >
              <div className="p-4">
                <p className="text-sm font-semibold text-foreground/85 mb-0.5">{r.name}</p>
                <p className="text-xs text-muted-foreground/70 mb-3">{r.location}</p>
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {r.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-white/20">
                  <span className="text-xs text-muted-foreground/70">Bookings: <strong className="text-foreground/80">{r.bookings}</strong></span>
                  <StatusBadge status={r.status} />
                </div>
              </div>
            </div>
          ))}

          {/* Add New Card */}
          <div
            className="rounded-2xl border-2 border-dashed border-green-300/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer hover:border-green-400/60 hover:bg-green-50/20"
            onClick={() => setModalOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Add new resort"
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setModalOpen(true); } }}
          >
            <div className="p-4 flex items-center justify-center h-full min-h-36">
              <div className="text-center text-green-500/70">
                <Plus className="w-8 h-8 mx-auto mb-1.5" />
                <div className="text-xs font-semibold">Add new resort</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddResortModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={loadResorts} />
      <ResortDetailModal open={detailOpen} onOpenChange={setDetailOpen} resort={selectedResort} onSuccess={loadResorts} />
    </>
  );
};
