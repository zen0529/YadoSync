import { useRef } from "react";
import cc from "currency-codes";
import { MapPin, Upload } from "lucide-react";
import { AsYouType } from "libphonenumber-js";
import { Field } from "@/components/ui/field";
import { inputCls } from "@/components/ui/input-cls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  COUNTRIES, CURRENCIES, TIMEZONES, PROPERTY_TYPES,
} from "../../constants/propertyConstants";

/**
 * BasicInfoTab — renders the combined "Basic Info & Location" tab.
 *
 * Props:
 *  - form                {object}   current form state
 *  - set                 {function} set(key, value) — top-level field setter
 *  - handleCountryChange {function} country cascade handler
 *  - handlePhoneChange   {function} formatted phone setter
 *  - logoData            {object}   { file, preview } draft logo state
 *  - setLogoData         {function} setter for the draft logo state
 */
export const BasicInfoTab = ({ form, set, handleCountryChange, handlePhoneChange, logoData, setLogoData }) => {
  const logoInputRef = useRef(null);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setLogoData({ file, preview });
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
    {/* Property Title */}
    <Field label="Property Title">
      <input
        className={inputCls}
        placeholder="e.g. Demo Hotel"
        value={form.title}
        onChange={e => set("title", e.target.value)}
        required
      />
    </Field>

    {/* Property Type + Country */}
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

      <Field label="Country">
        <Select value={form.country} onValueChange={handleCountryChange}>
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
    </div>

    {/* Currency + Timezone (cascade targets) */}
    <div className="grid grid-cols-2 gap-3">
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
    </div>

    {/* Email + Phone (cascade target) */}
    <div className="grid grid-cols-2 gap-3">
      <Field label="Contact Email">
        <input
          className={inputCls}
          type="email"
          placeholder="hotel@example.io"
          value={form.email}
          onChange={e => set("email", e.target.value)}
        />
      </Field>

      <Field label="Owner Password">
        <input
          className={inputCls}
          type="text"
          placeholder="Temp login password"
          value={form.password}
          onChange={e => set("password", e.target.value)}
          required
        />
      </Field>

      <Field label="Phone Number">
        <input
          className={inputCls}
          type="tel"
          placeholder="+44 1234 567890"
          value={form.phone}
          onChange={e => handlePhoneChange(e.target.value)}
        />
      </Field>
    </div>

    {/* Logo + Website */}
    <div className="grid grid-cols-2 gap-3">
      <Field label="Logo">
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoChange}
        />
        <button
          type="button"
          onClick={() => logoInputRef.current?.click()}
          className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-white/20 bg-white/40 dark:bg-white/5 text-sm transition-all ${
            logoData?.preview ? "border-green-500/40 bg-green-500/5 text-green-600 dark:text-green-400" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          {logoData?.preview ? logoData.file?.name : (form.logo_url ? "Change Logo…" : "Choose logo file…")}
        </button>
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

    {/* Address & Location section */}
    <div className="pt-2">
      <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">
        Address & Location
      </p>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Street Address">
            <input
              className={inputCls}
              placeholder="e.g. 123 Demo Street"
              value={form.address}
              onChange={e => set("address", e.target.value)}
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

        <div className="grid grid-cols-2 gap-3">
          <Field label="State / Province">
            <input
              className={inputCls}
              placeholder="e.g. Demo State"
              value={form.state}
              onChange={e => set("state", e.target.value)}
            />
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
      </div>
    </div>

    {/* Mini map preview */}
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
  );
};
