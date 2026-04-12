import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createProperty } from "../queries";
import { useAuth } from "@/features/auth/context/AuthContext";

const PLATFORMS = [
  { id: "klook", label: "Klook" },
  { id: "booking", label: "Booking.com" },
  { id: "agoda", label: "Agoda" },
];

const INITIAL_FORM = {
  name: "",
  location: "",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  commissionRate: "",
  platforms: [],
};

export const AddResortModal = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const togglePlatform = (id) =>
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(id)
        ? f.platforms.filter(p => p !== id)
        : [...f.platforms, id],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await createProperty(user.id, form);
      setForm(INITIAL_FORM);
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Resort</DialogTitle>
          <DialogDescription>Enter the property and owner details to onboard a new client.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Property Details */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Property Details</label>
            <input
              required
              placeholder="Resort name"
              value={form.name}
              onChange={e => update("name", e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-black/10 bg-white outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
            />
            <input
              required
              placeholder="Location (e.g. Cebu, Philippines)"
              value={form.location}
              onChange={e => update("location", e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-black/10 bg-white outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
            />
            <input
              required
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="Commission rate (%)"
              value={form.commissionRate}
              onChange={e => update("commissionRate", e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-black/10 bg-white outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
            />
          </div>

          {/* Owner Details */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Owner Details</label>
            <input
              required
              placeholder="Owner name"
              value={form.ownerName}
              onChange={e => update("ownerName", e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-black/10 bg-white outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
            />
            <input
              required
              type="email"
              placeholder="Owner email"
              value={form.ownerEmail}
              onChange={e => update("ownerEmail", e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-black/10 bg-white outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
            />
            <input
              required
              type="tel"
              placeholder="Owner phone"
              value={form.ownerPhone}
              onChange={e => update("ownerPhone", e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-black/10 bg-white outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
            />
          </div>

          {/* Platforms */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platforms</label>
            <div className="flex gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
                    ${form.platforms.includes(p.id)
                      ? "bg-green-50 border-green-500 text-green-600"
                      : "border-black/10 text-muted-foreground hover:border-green-300 hover:text-green-600"
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8" disabled={saving}>
              {saving ? "Saving..." : "Add Resort"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
