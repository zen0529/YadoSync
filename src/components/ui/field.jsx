/**
 * Field — reusable form field wrapper with an uppercase label.
 * Used across any feature that renders labeled form inputs.
 */
export const Field = ({ label, children, className = "" }) => (
  <div className={className}>
    <label className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1.5 block">
      {label}
    </label>
    {children}
  </div>
);
