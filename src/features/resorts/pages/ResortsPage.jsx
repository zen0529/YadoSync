import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/PlatformBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { getProperties } from "../queries";
import { AddResortModal } from "../modals/AddResortModal";
import { ResortDetailModal } from "../modals/ResortDetailModal";

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

  // Load on mount
  useState(() => { loadResorts(); });

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button className="bg-green-600 hover:bg-green-700 text-white text-xs h-8" onClick={() => setModalOpen(true)}>
          + Add resort
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Loading resorts...</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {resorts.map(r => (
            <Card key={r.id} className="border border-black/5 shadow-sm hover:-translate-y-0.5 transition-transform cursor-pointer"
              onClick={() => { setSelectedResort(r); setDetailOpen(true); }}>
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground mb-0.5">{r.name}</p>
                <p className="text-xs text-muted-foreground mb-3">{r.location}</p>
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {r.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-black/5">
                  <span className="text-xs text-muted-foreground">Bookings: <strong className="text-foreground">{r.bookings}</strong></span>
                  <StatusBadge status={r.status} />
                </div>
              </CardContent>
            </Card>
          ))}
          <Card
            className="border-2 border-dashed border-green-200 shadow-none bg-green-50/50 hover:-translate-y-0.5 transition-transform cursor-pointer"
            onClick={() => setModalOpen(true)}
          >
            <CardContent className="p-4 flex items-center justify-center h-full min-h-36">
              <div className="text-center text-green-500">
                <div className="text-3xl mb-1">+</div>
                <div className="text-xs font-semibold">Add new resort</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AddResortModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={loadResorts} />
      <ResortDetailModal open={detailOpen} onOpenChange={setDetailOpen} resort={selectedResort} onSuccess={loadResorts} />
    </>
  );
};
