import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RESORTS } from "@/data/constants";
import { Loader2, Download, Check } from "lucide-react";

// Mock data returned from a hypothetical OTA API (e.g. Booking.com via Channex)
const MOCK_OTA_LISTINGS = [
  { id: "ota_101", name: "Beachfront Cabin - Booking.com", price: 6500, minStay: 2 },
  { id: "ota_102", name: "Ocean View Villa (With Breakfast)", price: 5500, minStay: 1 },
  { id: "ota_103", name: "Standard Twin Room - non refundable", price: 3000, minStay: 1 },
];

export const ImportOtaModal = ({ open, onOpenChange, onImport }) => {
  const [step, setStep] = useState(1);
  const [resort, setResort] = useState("");
  const [platform, setPlatform] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedListings, setSelectedListings] = useState([]);

  const handleFetchListings = (e) => {
    e.preventDefault();
    if (!resort || !platform) return;
    
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  const toggleListing = (listingId) => {
    setSelectedListings(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const handleConfirmImport = () => {
    // Map selected OTA listings into our standard ROOM format
    const roomsToImport = MOCK_OTA_LISTINGS
      .filter(l => selectedListings.includes(l.id))
      .map(l => ({
        id: `r-${Math.floor(Math.random() * 10000)}`,
        resort: resort,
        name: l.name,
        basePrice: l.price,
        baseMinStay: l.minStay,
        // In a real app, we would also save the channel mapping here
        // e.g. mappedChannelIds: { booking: l.id }
      }));

    onImport(roomsToImport);
    
    // Reset and close
    setStep(1);
    setResort("");
    setPlatform("");
    setSelectedListings([]);
    onOpenChange(false);
  };

  const handleClose = () => {
    setStep(1);
    setResort("");
    setPlatform("");
    setSelectedListings([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="glass-card border-white/20 text-foreground sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {step === 1 ? "Import OTA Listings" : "Review & Select Listings"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step === 1 
              ? "Connect to your OTA to automatically generate your room inventory."
              : `Found ${MOCK_OTA_LISTINGS.length} listings on ${platform}. Select the ones to import to ${resort}.`
            }
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <form onSubmit={handleFetchListings} className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground/80 mb-1 block">Target Property</label>
                <Select value={resort} onValueChange={setResort}>
                  <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                    <SelectValue placeholder="Select which property these rooms belong to" />
                  </SelectTrigger>
                  <SelectContent className="glass-dropdown border-white/30">
                    {RESORTS.map(r => <SelectItem key={r.name} value={r.name} className="text-sm rounded-lg">{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground/80 mb-1 block">OTA Platform</label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                    <SelectValue placeholder="Select connected platform" />
                  </SelectTrigger>
                  <SelectContent className="glass-dropdown border-white/30">
                    <SelectItem value="Booking.com" className="text-sm rounded-lg">Booking.com</SelectItem>
                    <SelectItem value="Airbnb" className="text-sm rounded-lg">Airbnb</SelectItem>
                    <SelectItem value="Agoda" className="text-sm rounded-lg">Agoda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={!resort || !platform || loading}
              className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              {loading ? "Fetching listings..." : "Fetch Listings"}
            </Button>
          </form>
        )}

        {step === 2 && (
          <div className="mt-4 space-y-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {MOCK_OTA_LISTINGS.map(listing => {
                const isSelected = selectedListings.includes(listing.id);
                return (
                  <div 
                    key={listing.id}
                    onClick={() => toggleListing(listing.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3
                      ${isSelected 
                        ? "bg-green-500/10 border-green-500/50 shadow-sm" 
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                  >
                    <div className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center shrink-0 border transition-colors
                      ${isSelected ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/30"}
                    `}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isSelected ? "text-foreground" : "text-foreground/80"}`}>
                        {listing.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground/70">
                        <span>ID: {listing.id}</span>
                        <span>•</span>
                        <span>₱{listing.price.toLocaleString()}/night</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <Button variant="ghost" onClick={() => setStep(1)} className="rounded-xl">
                Back
              </Button>
              <Button 
                onClick={handleConfirmImport} 
                disabled={selectedListings.length === 0}
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-md shadow-green-500/20"
              >
                Import {selectedListings.length} Rooms
              </Button>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
};
