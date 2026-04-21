import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { addMyProperty } from "../../queries";
import { supabase } from "@/lib/supabase";

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "house", label: "House" },
  { value: "hotel", label: "Hotel" },
  { value: "resort", label: "Resort" },
  { value: "guesthouse", label: "Guesthouse" },
  { value: "hostel", label: "Hostel" },
  { value: "studio", label: "Studio" },
  { value: "room", label: "Room" },
];

const CURRENCIES = [
  { value: "PHP", label: "PHP — Philippine Peso" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "JPY", label: "JPY — Japanese Yen" },
];

const EMPTY_FORM = {
  name: "",
  propertyType: "",
  currency: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postcode: "",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
};

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-muted-foreground/80">
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  "h-9 w-full rounded-lg border border-white/30 bg-white/40 px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 hover:bg-white/50 placeholder:text-muted-foreground/40";

export const AddPropertyModal = ({ open, onClose, userId, onSaved }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const setSelect = (key) => (value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Property name is required.");
      return;
    }
    setSaving(true);
    setError("");

    const beds24Name = `${form.name}__${Date.now()}`;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated.");

      const { data, error } = await supabase.functions.invoke(
        "create-property",
        {
          body: { ...form, name: beds24Name },
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );
      console.log("Edge Function response:", data, error);  // ← browser console
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      let result;
      try {
        result = await addMyProperty(userId, {
          ...form,
          beds24PropertyId: data.beds24PropertyId,
          beds24Name,
        });
      } catch (supabaseErr) {
        await supabase.functions.invoke("delete-property", {
          body: { beds24PropertyId: data.beds24PropertyId },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        throw supabaseErr;
      }

      onSaved(result);
      handleClose();
    } catch (err) {
      setError(err.message || "Failed to save property.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Add Property
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-2">
          <Field label="Property Name *">
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Casa del Sol Beach Resort"
              value={form.name}
              onChange={set("name")}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Property Type">
              <Select
                value={form.propertyType}
                onValueChange={setSelect("propertyType")}
              >
                <SelectTrigger className="h-9 border-white/30 bg-white/40 text-sm hover:bg-white/50">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Currency">
              <Select
                value={form.currency}
                onValueChange={setSelect("currency")}
              >
                <SelectTrigger className="h-9 border-white/30 bg-white/40 text-sm hover:bg-white/50">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Address">
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. 123 Main St"
              value={form.address}
              onChange={set("address")}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="City">
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. Cebu City"
                value={form.city}
                onChange={set("city")}
              />
            </Field>

            <Field label="State / Province">
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. Cebu"
                value={form.state}
                onChange={set("state")}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Country">
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. Philippines"
                value={form.country}
                onChange={set("country")}
              />
            </Field>

            <Field label="Postal Code">
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. 6000"
                value={form.postcode}
                onChange={set("postcode")}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Owner Name">
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. Maria Santos"
                value={form.ownerName}
                onChange={set("ownerName")}
              />
            </Field>

            <Field label="Owner Email">
              <input
                type="email"
                className={inputCls}
                placeholder="e.g. maria@example.com"
                value={form.ownerEmail}
                onChange={set("ownerEmail")}
              />
            </Field>
          </div>

          <Field label="Mobile Number">
            <input
              type="tel"
              className={inputCls}
              placeholder="e.g. +63 917 123 4567"
              value={form.ownerPhone}
              onChange={set("ownerPhone")}
            />
          </Field>

          {error && (
            <p className="text-xs text-red-500 bg-red-50/70 border border-red-200/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={saving}
            className="border-white/30 text-sm h-9 px-5 rounded-lg hover:bg-white/30"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-500/90 hover:bg-green-600 text-white text-sm h-9 px-5 rounded-lg shadow-md shadow-green-500/20"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Property"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
