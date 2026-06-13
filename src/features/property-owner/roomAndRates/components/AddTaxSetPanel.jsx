import React, { useState } from "react";
import { X, Loader2, Receipt, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Field } from "@/components/ui/field";
import { inputCls } from "@/components/ui/input-cls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createTaxSet } from "../channex/createTaxSet";
import { createTax } from "../channex/createTax";
import { toast } from "sonner";

const CURRENCIES = ["PHP", "USD", "EUR", "SGD", "AUD", "GBP", "JPY"];
const TAX_LOGIC_OPTIONS = [
  { value: "percent",    label: "Percent (%)" },
  { value: "per_room",   label: "Per Room" },
  { value: "per_person", label: "Per Person" },
];
const TAX_TYPE_OPTIONS = [
  { value: "tax",       label: "Tax" },
  { value: "city_tax",  label: "City Tax" },
  { value: "fee",       label: "Fee" },
];

const DEFAULT_TAX_ENTRY = {
  title:        "",
  logic:        "percent",
  type:         "tax",
  rate:         "0.00",
  isInclusive:  true,
  skipNights:   0,
  maxNights:    0,
};

/**
 * AddTaxSetPanel — slide-over sub-panel for creating a Tax Set + optional Tax entry.
 *
 * Props:
 *  - open              {boolean}
 *  - onClose           {function}
 *  - channexPropertyId {string}
 *  - currency          {string}   pre-filled from parent rate plan form
 *  - onCreated         {function} called with the new tax_set_id on success
 */
export const AddTaxSetPanel = ({ open, onClose, channexPropertyId, currency = "PHP", onCreated }) => {
  const [submitting, setSubmitting] = useState(false);
  const [showTaxEntry, setShowTaxEntry] = useState(false);
  const [taxSetForm, setTaxSetForm] = useState({
    title:    "",
    currency: currency,
  });
  const [taxEntry, setTaxEntry] = useState(DEFAULT_TAX_ENTRY);

  // Reset when opened
  React.useEffect(() => {
    if (open) {
      setTaxSetForm({ title: "", currency });
      setTaxEntry(DEFAULT_TAX_ENTRY);
      setShowTaxEntry(false);
    }
  }, [open, currency]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taxSetForm.title.trim()) return;
    if (!channexPropertyId) {
      toast.error("No Channex property ID available.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create tax set
      const taxSetResult = await createTaxSet({
        title:      taxSetForm.title,
        currency:   taxSetForm.currency,
        propertyId: channexPropertyId,
      });
      const taxSetId = taxSetResult?.data?.id;
      if (!taxSetId) throw new Error("Channex did not return a tax set ID.");

      // 2. Optionally create a tax entry within the set
      if (showTaxEntry && taxEntry.title.trim()) {
        await createTax({
          taxSetId,
          propertyId:           channexPropertyId,
          title:                taxEntry.title,
          logic:                taxEntry.logic,
          type:                 taxEntry.type,
          rate:                 taxEntry.rate,
          isInclusive:          taxEntry.isInclusive,
          skipNights:           Number(taxEntry.skipNights) || 0,
          maxNights:            Number(taxEntry.maxNights) || 0,
          applicableDateRanges: [],
        });
      }

      toast.success("Tax set created");
      onCreated?.(taxSetId);
      onClose();
    } catch (err) {
      toast.error("Failed to create tax set", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop — z-60 to sit above the parent panel (z-50) */}
      <div
        className={`fixed inset-0 z-60 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel — z-70, narrower than parent */}
      <div
        className={`fixed top-0 right-0 z-70 h-full w-full max-w-[440px] flex flex-col bg-background/90 dark:bg-[#0F172A]/95 backdrop-blur-2xl border-l border-black/5 dark:border-white/10 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Receipt className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">Create Tax Set</h2>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">Define a reusable group of taxes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form body */}
        <form id="add-tax-set-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Tax Set basics */}
          <div className="space-y-4">
            <Field label="Tax Set Title">
              <input
                className={inputCls}
                value={taxSetForm.title}
                onChange={e => setTaxSetForm(f => ({ ...f, title: e.target.value }))}
                placeholder='e.g. "VAT 20%"'
                required
              />
            </Field>

            <Field label="Currency">
              <Select
                value={taxSetForm.currency}
                onValueChange={v => setTaxSetForm(f => ({ ...f, currency: v }))}
              >
                <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-dropdown rounded-xl border-white/30">
                  {CURRENCIES.map(c => (
                    <SelectItem key={c} value={c} className="text-sm rounded-lg">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Collapsible: Add a Tax Entry */}
          <div className="border border-black/5 dark:border-white/10 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTaxEntry(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-black/3 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/8 transition-colors text-sm font-semibold text-foreground/80"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                Add a Tax Entry (optional)
              </span>
              {showTaxEntry
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
              }
            </button>

            {showTaxEntry && (
              <div className="p-4 space-y-4 border-t border-black/5 dark:border-white/10">
                <Field label="Tax Title">
                  <input
                    className={inputCls}
                    value={taxEntry.title}
                    onChange={e => setTaxEntry(t => ({ ...t, title: e.target.value }))}
                    placeholder='e.g. "VAT"'
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Logic">
                    <Select
                      value={taxEntry.logic}
                      onValueChange={v => setTaxEntry(t => ({ ...t, logic: v }))}
                    >
                      <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-dropdown rounded-xl border-white/30">
                        {TAX_LOGIC_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value} className="text-sm rounded-lg">{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Type">
                    <Select
                      value={taxEntry.type}
                      onValueChange={v => setTaxEntry(t => ({ ...t, type: v }))}
                    >
                      <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-dropdown rounded-xl border-white/30">
                        {TAX_TYPE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value} className="text-sm rounded-lg">{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Rate">
                    <div className="relative">
                      <input
                        className={`${inputCls} pr-10`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={taxEntry.rate}
                        onChange={e => setTaxEntry(t => ({ ...t, rate: e.target.value }))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/60">
                        {taxEntry.logic === "percent" ? "%" : taxSetForm.currency}
                      </span>
                    </div>
                  </Field>

                  <Field label="Inclusive?">
                    <div className="flex items-center h-10 gap-3">
                      <button
                        type="button"
                        onClick={() => setTaxEntry(t => ({ ...t, isInclusive: !t.isInclusive }))}
                        className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 focus:outline-none ${
                          taxEntry.isInclusive ? "bg-amber-500" : "bg-muted-foreground/30"
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform duration-200 ${
                          taxEntry.isInclusive ? "translate-x-4.5" : "translate-x-0"
                        }`} />
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {taxEntry.isInclusive ? "Inclusive" : "Exclusive"}
                      </span>
                    </div>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Skip Nights">
                    <input
                      className={inputCls}
                      type="number"
                      min="0"
                      value={taxEntry.skipNights}
                      onChange={e => setTaxEntry(t => ({ ...t, skipNights: e.target.value }))}
                    />
                  </Field>
                  <Field label="Max Nights">
                    <input
                      className={inputCls}
                      type="number"
                      min="0"
                      value={taxEntry.maxNights}
                      onChange={e => setTaxEntry(t => ({ ...t, maxNights: e.target.value }))}
                      placeholder="0 = no limit"
                    />
                  </Field>
                </div>

                <p className="text-[11px] text-muted-foreground/60">
                  Applicable date ranges can be configured in Channex after creation.
                </p>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-end gap-3 shrink-0">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting} className="hover:bg-black/5 dark:hover:bg-white/10">
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-tax-set-form"
            disabled={submitting || !taxSetForm.title.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white min-w-[130px]"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Tax Set"}
          </Button>
        </div>
      </div>
    </>
  );
};
