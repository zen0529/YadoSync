import { Field } from "@/components/ui/field";
import { Toggle } from "@/components/ui/toggle";
import { inputCls } from "@/components/ui/input-cls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MIN_STAY_TYPES } from "../../constants/propertyConstants";

/**
 * SettingsTab — renders the availability, pricing, and booking rules settings.
 *
 * Props:
 *  - form       {object}   current form state
 *  - setSetting {function} setSetting(key, value) — updates form.settings[key]
 */
export const SettingsTab = ({ form, setSetting }) => (
  <div className="space-y-5">
    {/* Availability Auto-update */}
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

    {/* Stay & Pricing */}
    <div>
      <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
        Stay & Pricing
      </p>
      <div className="space-y-3">
        <Field label="Min Stay Type">
          <Select value={form.settings.min_stay_type} onValueChange={v => setSetting("min_stay_type", v)}>
            <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-dropdown rounded-xl border-white/30">
              {MIN_STAY_TYPES.map(t => (
                <SelectItem key={t} value={t} className="text-sm rounded-lg capitalize">
                  {t.replace("_", " ")}
                </SelectItem>
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

    {/* Booking Rules */}
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
);
