import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { updateProperty } from "../queries";

const PLATFORMS = [
  { id: "klook", label: "Klook" },
  { id: "booking", label: "Booking.com" },
  { id: "agoda", label: "Agoda" },
];

const INPUT_CLASS = "w-full h-9 px-3 text-sm rounded-lg border border-black/10 outline-none transition-all";
const INPUT_READONLY = `${INPUT_CLASS} bg-gray-50 text-muted-foreground cursor-default`;
const INPUT_EDITABLE = `${INPUT_CLASS} bg-white focus:ring-2 focus:ring-green-500/30 focus:border-green-500`;

export const ResortDetailModal = ({ open, onOpenChange, resort, onSuccess }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (resort) {
      setForm({
        name: resort.name,
        location: resort.location,
        ownerName: resort.ownerName || "",
        ownerEmail: resort.ownerEmail || "",
        ownerPhone: resort.ownerPhone || "",
        commissionRate: resort.commissionRate ?? "",
        status: resort.status || "active",
        platforms: resort.platforms || [],
      });
      setEditing(false);
      setError(null);
    }
  }, [resort]);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const togglePlatform = (id) =>
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(id)
        ? f.platforms.filter(p => p !== id)
        : [...f.platforms, id],
    }));

  const handleCancel = () => {
    if (resort) {
      setForm({
        name: resort.name,
        location: resort.location,
        ownerName: resort.ownerName || "",
        ownerEmail: resort.ownerEmail || "",
        ownerPhone: resort.ownerPhone || "",
        commissionRate: resort.commissionRate ?? "",
        status: resort.status || "active",
        platforms: resort.platforms || [],
      });
    }
    setEditing(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await updateProperty(resort.id, form);
      setEditing(false);
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!resort) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && editing) return; onOpenChange(v); }}>
      <DialogContent className="max-w-md" onPointerDownOutside={e => editing && e.preventDefault()} onEscapeKeyDown={e => editing && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Resort" : "Resort Details"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the property and owner details." : "View property information and connected platforms."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Property Details */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Property Details</label>
            <input
              readOnly={!editing}
              placeholder="Resort name"
              value={form.name || ""}
              onChange={e => update("name", e.target.value)}
              className={editing ? INPUT_EDITABLE : INPUT_READONLY}
            />
            <input
              readOnly={!editing}
              placeholder="Location"
              value={form.location || ""}
              onChange={e => update("location", e.target.value)}
              className={editing ? INPUT_EDITABLE : INPUT_READONLY}
            />
            <input
              readOnly={!editing}
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="Commission rate (%)"
              value={form.commissionRate ?? ""}
              onChange={e => update("commissionRate", e.target.value)}
              className={editing ? INPUT_EDITABLE : INPUT_READONLY}
            />
          </div>

          {/* Owner Details */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Owner Details</label>
            <input
              readOnly={!editing}
              placeholder="Owner name"
              value={form.ownerName || ""}
              onChange={e => update("ownerName", e.target.value)}
              className={editing ? INPUT_EDITABLE : INPUT_READONLY}
            />
            <input
              readOnly={!editing}
              type="email"
              placeholder="Owner email"
              value={form.ownerEmail || ""}
              onChange={e => update("ownerEmail", e.target.value)}
              className={editing ? INPUT_EDITABLE : INPUT_READONLY}
            />
            <input
              readOnly={!editing}
              type="tel"
              placeholder="Owner phone"
              value={form.ownerPhone || ""}
              onChange={e => update("ownerPhone", e.target.value)}
              className={editing ? INPUT_EDITABLE : INPUT_READONLY}
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
                  disabled={!editing}
                  onClick={() => editing && togglePlatform(p.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
                    ${form.platforms?.includes(p.id)
                      ? "bg-green-50 border-green-500 text-green-600"
                      : editing
                        ? "border-black/10 text-muted-foreground hover:border-green-300 hover:text-green-600"
                        : "border-black/10 text-muted-foreground opacity-50"
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          {editing && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
              <div className="flex gap-2">
                {["active", "setup"].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update("status", s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all capitalize
                      ${form.status === s
                        ? "bg-green-50 border-green-500 text-green-600"
                        : "border-black/10 text-muted-foreground hover:border-green-300 hover:text-green-600"
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            {editing ? (
              <>
                <button type="button" className="inline-flex items-center justify-center h-8 px-2.5 text-xs font-medium rounded-[10px] border border-border bg-background hover:bg-muted transition-all" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="button" className="inline-flex items-center justify-center h-8 px-2.5 text-xs font-medium rounded-[10px] bg-green-600 hover:bg-green-700 text-white transition-all disabled:opacity-50" disabled={saving} onClick={handleSubmit}>
                  {saving ? "Saving..." : "Update Resort"}
                </button>
              </>
            ) : (
              <>
                <button type="button" className="inline-flex items-center justify-center h-8 px-2.5 text-xs font-medium rounded-[10px] border border-border bg-background hover:bg-muted transition-all" onClick={() => onOpenChange(false)}>
                  Close
                </button>
                <button type="button" className="inline-flex items-center justify-center h-8 px-2.5 text-xs font-medium rounded-[10px] bg-green-600 hover:bg-green-700 text-white transition-all" onClick={() => setEditing(true)}>
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
