import { useState, useEffect } from "react";
import cc from "currency-codes";
import { toast } from "sonner";
import { validatePropertyForm } from "../utils/validatePropertyForm";
import { createProperty } from "../queries/createProperty";
import { X, Building2, MapPin, Settings2, FileText, Plus, Trash2, Image, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TABS = [
  { id: "basic",    label: "Basic Info",  icon: Building2 },
  { id: "location", label: "Location",    icon: MapPin },
  { id: "settings", label: "Settings",    icon: Settings2 },
  { id: "content",  label: "Content",     icon: FileText },
];

const TIMEZONES = [
  "Europe/London", "Europe/Paris", "Europe/Berlin", "America/New_York",
  "America/Los_Angeles", "America/Chicago", "Asia/Manila", "Asia/Singapore",
  "Asia/Tokyo", "Asia/Dubai", "Australia/Sydney", "Pacific/Auckland",
];

const CURRENCIES = cc.codes();
const COUNTRIES  = [
  { code: "GB", label: "United Kingdom" }, { code: "US", label: "United States" },
  { code: "PH", label: "Philippines" }, { code: "SG", label: "Singapore" },
  { code: "AU", label: "Australia" }, { code: "DE", label: "Germany" },
  { code: "FR", label: "France" }, { code: "JP", label: "Japan" },
  { code: "AE", label: "UAE" },
];
const PROPERTY_TYPES = ["hotel", "hostel", "apartment", "resort", "villa", "guesthouse", "motel"];
const MIN_STAY_TYPES = ["both", "arrival_only", "nightly"];

const defaultForm = {
  title: "",
  currency: "GBP",
  email: "",
  phone: "",
  zip_code: "",
  country: "GB",
  state: "",
  city: "",
  address: "",
  longitude: "",
  latitude: "",
  timezone: "Europe/London",
  property_type: "hotel",
  logo_url: "",
  website: "",
  settings: {
    allow_availability_autoupdate_on_confirmation: true,
    allow_availability_autoupdate_on_modification: false,
    allow_availability_autoupdate_on_cancellation: false,
    min_stay_type: "both",
    min_price: "",
    max_price: "",
    state_length: 500,
    cut_off_time: "00:00:00",
    cut_off_days: 0,
    max_day_advance: "",
  },
  content: {
    description: "",
    important_information: "",
    photos: [],
  },
};

/* ─── tiny reusable field wrappers ─── */
const Field = ({ label, children, className = "" }) => (
  <div className={className}>
    <label className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1.5 block">
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-green-500/40 transition-all";

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between cursor-pointer py-2.5 px-3.5 rounded-xl hover:bg-white/20 dark:hover:bg-white/5 transition-colors group">
    <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-all duration-200 flex-shrink-0 ${
        checked ? "bg-green-500" : "bg-muted dark:bg-white/10"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-4.5" : "translate-x-0"
        }`}
      />
    </button>
  </label>
);

/* ─── Main Component ─── */
export const AddPropertyPanel = ({ open, onClose }) => {
  const [tab, setTab]      = useState("basic");
  const [form, setForm]    = useState(defaultForm);
  const [newPhoto, setNewPhoto]   = useState({ url: "", description: "", author: "" });
  const [submitting, setSubmitting] = useState(false);

  // Reset form when panel opens
  useEffect(() => {
    if (open) {
      setForm(defaultForm);
      setTab("basic");
    }
  }, [open]);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const setSetting = (key, value) =>
    setForm(f => ({ ...f, settings: { ...f.settings, [key]: value } }));
  const setContent = (key, value) =>
    setForm(f => ({ ...f, content: { ...f.content, [key]: value } }));

  const addPhoto = () => {
    if (!newPhoto.url) return;
    setContent("photos", [
      ...form.content.photos,
      { ...newPhoto, position: form.content.photos.length, kind: "photo" },
    ]);
    setNewPhoto({ url: "", description: "", author: "" });
  };

  const removePhoto = (i) =>
    setContent("photos", form.content.photos.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePropertyForm(form, setTab)) return;

    setSubmitting(true);
    try {
      await createProperty(form);
      toast.success("Property created!", {
        description: `"${form.title}" has been successfully added.`,
      });
      onClose();
    } catch (err) {
      toast.error("Failed to create property", {
        description: err.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel — matches PropertyLedgerModal bg */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[520px] flex flex-col bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
              <Building2 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">Add Property</h2>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">Fill in the property details below</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Tab nav ── */}
        <div className="flex gap-1 px-4 py-3 border-b border-border shrink-0 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                tab === id
                  ? "bg-green-500 text-white shadow-md shadow-green-500/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Scrollable body (only this scrolls) ── */}
        <form id="add-property-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">

            {/* ══ BASIC INFO TAB ══ */}
            {tab === "basic" && (
              <div className="space-y-4">
                <Field label="Property Title">
                  <input
                    className={inputCls}
                    placeholder="e.g. Demo Hotel"
                    value={form.title}
                    onChange={e => set("title", e.target.value)}
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Property Type">
                    <Select value={form.property_type} onValueChange={v => set("property_type", v)}>
                      <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-dropdown rounded-xl border-white/30">
                        {PROPERTY_TYPES.map(t => (
                          <SelectItem key={t} value={t} className="text-sm rounded-lg capitalize">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Currency">
                    <Select value={form.currency} onValueChange={v => set("currency", v)}>
                      <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-dropdown rounded-xl border-white/30 w-64">
                        {CURRENCIES.map(c => (
                          <SelectItem key={c} value={c} className="text-sm rounded-lg">
                            <span className="font-semibold">{c}</span>
                            <span className="text-muted-foreground ml-1.5">— {cc.code(c)?.currency}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field label="Contact Email">
                  <input
                    className={inputCls}
                    type="email"
                    placeholder="hotel@example.io"
                    value={form.email}
                    onChange={e => set("email", e.target.value)}
                  />
                </Field>

                <Field label="Phone Number">
                  <input
                    className={inputCls}
                    type="tel"
                    placeholder="+44 1234 567890"
                    value={form.phone}
                    onChange={e => set("phone", e.target.value)}
                  />
                </Field>

                <Field label="Timezone">
                  <Select value={form.timezone} onValueChange={v => set("timezone", v)}>
                    <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown rounded-xl border-white/30">
                      {TIMEZONES.map(tz => (
                        <SelectItem key={tz} value={tz} className="text-sm rounded-lg">{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Logo URL">
                    <input
                      className={inputCls}
                      placeholder="https://..."
                      value={form.logo_url}
                      onChange={e => set("logo_url", e.target.value)}
                    />
                  </Field>
                  <Field label="Website">
                    <input
                      className={inputCls}
                      placeholder="https://..."
                      value={form.website}
                      onChange={e => set("website", e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* ══ LOCATION TAB ══ */}
            {tab === "location" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Country">
                    <Select value={form.country} onValueChange={v => set("country", v)}>
                      <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-dropdown rounded-xl border-white/30">
                        {COUNTRIES.map(c => (
                          <SelectItem key={c.code} value={c.code} className="text-sm rounded-lg">{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="ZIP / Postcode">
                    <input
                      className={inputCls}
                      placeholder="e.g. SA23 2JH"
                      value={form.zip_code}
                      onChange={e => set("zip_code", e.target.value)}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="State / Province">
                    <input
                      className={inputCls}
                      placeholder="e.g. Demo State"
                      value={form.state}
                      onChange={e => set("state", e.target.value)}
                    />
                  </Field>
                  <Field label="City">
                    <input
                      className={inputCls}
                      placeholder="e.g. Demo Town"
                      value={form.city}
                      onChange={e => set("city", e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Street Address">
                  <input
                    className={inputCls}
                    placeholder="e.g. 123 Demo Street"
                    value={form.address}
                    onChange={e => set("address", e.target.value)}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Latitude">
                    <input
                      className={inputCls}
                      type="number"
                      step="any"
                      placeholder="51.5285582"
                      value={form.latitude}
                      onChange={e => set("latitude", e.target.value)}
                    />
                  </Field>
                  <Field label="Longitude">
                    <input
                      className={inputCls}
                      type="number"
                      step="any"
                      placeholder="-0.2416781"
                      value={form.longitude}
                      onChange={e => set("longitude", e.target.value)}
                    />
                  </Field>
                </div>

                {/* Mini map placeholder */}
                {form.latitude && form.longitude && (
                  <div className="rounded-xl overflow-hidden border border-border h-36 flex items-center justify-center bg-green-50/50 dark:bg-green-500/5">
                    <div className="text-center">
                      <MapPin className="w-6 h-6 text-green-400 mx-auto mb-1.5" />
                      <p className="text-xs text-muted-foreground/70">
                        {parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ SETTINGS TAB ══ */}
            {tab === "settings" && (
              <div className="space-y-5">
                {/* Availability autoupdate */}
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                    Availability Auto-update
                  </p>
                  <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                    <Toggle
                      label="On Confirmation"
                      checked={form.settings.allow_availability_autoupdate_on_confirmation}
                      onChange={v => setSetting("allow_availability_autoupdate_on_confirmation", v)}
                    />
                    <Toggle
                      label="On Modification"
                      checked={form.settings.allow_availability_autoupdate_on_modification}
                      onChange={v => setSetting("allow_availability_autoupdate_on_modification", v)}
                    />
                    <Toggle
                      label="On Cancellation"
                      checked={form.settings.allow_availability_autoupdate_on_cancellation}
                      onChange={v => setSetting("allow_availability_autoupdate_on_cancellation", v)}
                    />
                  </div>
                </div>

                {/* Stay & pricing */}
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                    Stay &amp; Pricing
                  </p>
                  <div className="space-y-3">
                    <Field label="Min Stay Type">
                      <Select value={form.settings.min_stay_type} onValueChange={v => setSetting("min_stay_type", v)}>
                        <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-dropdown rounded-xl border-white/30">
                          {MIN_STAY_TYPES.map(t => (
                            <SelectItem key={t} value={t} className="text-sm rounded-lg capitalize">{t.replace("_", " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Min Price">
                        <input
                          className={inputCls}
                          type="number"
                          min="0"
                          placeholder="e.g. 50"
                          value={form.settings.min_price ?? ""}
                          onChange={e => setSetting("min_price", e.target.value || null)}
                        />
                      </Field>
                      <Field label="Max Price">
                        <input
                          className={inputCls}
                          type="number"
                          min="0"
                          placeholder="e.g. 5000"
                          value={form.settings.max_price ?? ""}
                          onChange={e => setSetting("max_price", e.target.value || null)}
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                {/* Booking rules */}
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                    Booking Rules
                  </p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Cut-off Time">
                        <input
                          className={inputCls}
                          type="time"
                          step="1"
                          value={form.settings.cut_off_time}
                          onChange={e => setSetting("cut_off_time", e.target.value + ":00")}
                        />
                      </Field>
                      <Field label="Cut-off Days">
                        <input
                          className={inputCls}
                          type="number"
                          min="0"
                          value={form.settings.cut_off_days}
                          onChange={e => setSetting("cut_off_days", parseInt(e.target.value, 10))}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="State Length (days)">
                        <input
                          className={inputCls}
                          type="number"
                          min="1"
                          value={form.settings.state_length}
                          onChange={e => setSetting("state_length", parseInt(e.target.value, 10))}
                        />
                      </Field>
                      <Field label="Max Day Advance">
                        <input
                          className={inputCls}
                          type="number"
                          min="0"
                          placeholder="Unlimited"
                          value={form.settings.max_day_advance ?? ""}
                          onChange={e => setSetting("max_day_advance", e.target.value || null)}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ CONTENT TAB ══ */}
            {tab === "content" && (
              <div className="space-y-5">
                <Field label="Description">
                  <textarea
                    className={`${inputCls} resize-none min-h-[100px]`}
                    placeholder="Write a brief property description..."
                    value={form.content.description}
                    onChange={e => setContent("description", e.target.value)}
                  />
                </Field>

                <Field label="Important Information">
                  <textarea
                    className={`${inputCls} resize-none min-h-[80px]`}
                    placeholder="e.g. check-in procedures, house rules..."
                    value={form.content.important_information}
                    onChange={e => setContent("important_information", e.target.value)}
                  />
                </Field>

                {/* Photos */}
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                    Photos
                  </p>

                  {/* Existing photos */}
                  {form.content.photos.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {form.content.photos.map((ph, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border group"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
                            <img
                              src={ph.url}
                              alt={ph.description}
                              className="w-full h-full object-cover"
                              onError={e => { e.target.style.display = "none"; }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground/80 truncate">{ph.description || "Untitled"}</p>
                            <p className="text-[10px] text-muted-foreground/60 truncate">{ph.url}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-red-400 transition-all flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new photo */}
                  <div className="rounded-xl border border-dashed border-border p-4 space-y-3 bg-muted/10">
                    <div className="flex items-center gap-2 text-muted-foreground/60">
                      <Image className="w-4 h-4" />
                      <span className="text-xs font-semibold">Add Photo</span>
                    </div>
                    <input
                      className={inputCls}
                      placeholder="Photo URL"
                      value={newPhoto.url}
                      onChange={e => setNewPhoto(p => ({ ...p, url: e.target.value }))}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className={inputCls}
                        placeholder="Description"
                        value={newPhoto.description}
                        onChange={e => setNewPhoto(p => ({ ...p, description: e.target.value }))}
                      />
                      <input
                        className={inputCls}
                        placeholder="Author"
                        value={newPhoto.author}
                        onChange={e => setNewPhoto(p => ({ ...p, author: e.target.value }))}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addPhoto}
                      disabled={!newPhoto.url}
                      className="w-full h-8 rounded-lg bg-green-500/10 hover:bg-green-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-green-600 dark:text-green-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-green-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Photo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* ── Footer (outside the form/scroll area — always visible) ── */}
        <div className="shrink-0 px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            {TABS.findIndex(t => t.id === tab) + 1} of {TABS.length} sections
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-9 px-4 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all border border-border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <Button
              type="submit"
              form="add-property-form"
              disabled={submitting}
              className="h-9 px-5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-semibold shadow-lg shadow-green-500/25 border-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && (
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
              )}
              {submitting ? "Creating..." : "Create Property"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
