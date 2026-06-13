import React, { useState } from "react";
import { X, ShieldCheck } from "lucide-react";
import { Field } from "@/components/ui/field";
import { inputCls } from "@/components/ui/input-cls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CURRENCIES = ["PHP", "USD", "EUR", "SGD", "AUD", "GBP", "JPY"];
const PREPAYMENT_OPTIONS = [
  { value: "non_required",   label: "Non required" },
  { value: "deposit",        label: "Deposit" },
  { value: "full_prepayment", label: "Full prepayment" },
];
const CANCELLATION_TYPE_OPTIONS = [
  { value: "free",         label: "Free" },
  { value: "non_refundable", label: "Non-refundable" },
  { value: "partial",      label: "Partial refund" },
];
const NON_SHOW_POLICY_OPTIONS = [
  { value: "default",     label: "Default" },
  { value: "total_price", label: "Total Price" },
];

/**
 * AddCancellationPolicyPanel — UI-only slide-over for Cancellation Policy.
 *
 * API wiring is deferred. This panel captures the structure only.
 *
 * Props:
 *  - open    {boolean}
 *  - onClose {function}
 */
export const AddCancellationPolicyPanel = ({ open, onClose }) => {
  const [form, setForm] = useState({
    title:               "",
    currency:            "PHP",
    prepayment:          "non_required",
    cancellationType:    "free",
    deadlineAllowed:     false,
    nonShowPolicyType:   "default",
  });

  React.useEffect(() => {
    if (open) {
      setForm({
        title:             "",
        currency:          "PHP",
        prepayment:        "non_required",
        cancellationType:  "free",
        deadlineAllowed:   false,
        nonShowPolicyType: "default",
      });
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: wire to Channex API when ready
    onClose();
  };

  return (
    <>
      {/* Backdrop — z-60 */}
      <div
        className={`fixed inset-0 z-60 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel — z-70 */}
      <div
        className={`fixed top-0 right-0 z-70 h-full w-full max-w-[440px] flex flex-col bg-background/90 dark:bg-[#0F172A]/95 backdrop-blur-2xl border-l border-black/5 dark:border-white/10 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">Cancellation Policy</h2>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">Define guest cancellation terms</p>
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
        <form id="add-cancellation-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Notice: API pending */}
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3">
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              API integration pending — this form captures the structure only.
            </p>
          </div>

          <div className="space-y-4">
            <Field label="Title">
              <input
                className={inputCls}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Free cancellation 24h"
                required
              />
            </Field>

            <Field label="Currency">
              <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
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

          {/* Guarantee Payment */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider border-t border-black/5 dark:border-white/10 pt-4">
              Guarantee Payment
            </p>
            <Field label="Pre-payment">
              <Select value={form.prepayment} onValueChange={v => setForm(f => ({ ...f, prepayment: v }))}>
                <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-dropdown rounded-xl border-white/30">
                  {PREPAYMENT_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value} className="text-sm rounded-lg">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* After Reservation Cancellation */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider border-t border-black/5 dark:border-white/10 pt-4">
              After Reservation Cancellation Policy
            </p>
            <Field label="Type">
              <Select value={form.cancellationType} onValueChange={v => setForm(f => ({ ...f, cancellationType: v }))}>
                <SelectTrigger className="w-full glass-filter-btn rounded-xl border-white/20 h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-dropdown rounded-xl border-white/30">
                  {CANCELLATION_TYPE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value} className="text-sm rounded-lg">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Deadline-based Cancellation */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider border-t border-black/5 dark:border-white/10 pt-4">
              Deadline-based Cancellation
            </p>
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Is allowed:</label>
              <input
                type="checkbox"
                checked={form.deadlineAllowed}
                onChange={e => setForm(f => ({ ...f, deadlineAllowed: e.target.checked }))}
                className="w-4 h-4 accent-blue-500 rounded"
              />
            </div>
          </div>

          {/* Non-Show Policy */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider border-t border-black/5 dark:border-white/10 pt-4">
              Non-Show Policy
            </p>
            <Field label="Policy Type">
              <div className="flex gap-2">
                {NON_SHOW_POLICY_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, nonShowPolicyType: o.value }))}
                    className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all duration-200
                      ${form.nonShowPolicyType === o.value
                        ? "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400"
                        : "border-white/20 text-muted-foreground hover:border-blue-300/50 hover:text-blue-500 bg-white/10 dark:bg-white/5"
                      }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-end gap-3 shrink-0">
          <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-black/5 dark:hover:bg-white/10">
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-cancellation-form"
            disabled={!form.title.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white min-w-[130px]"
          >
            Save Policy
          </Button>
        </div>
      </div>
    </>
  );
};
