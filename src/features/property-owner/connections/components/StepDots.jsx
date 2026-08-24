// ── Step indicator ────────────────────────────────────────────────────────────
const StepDots = ({ current, total }) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: total }).map((_, i) => (
      <span
        key={i}
        className={`h-1.5 rounded-full transition-all duration-300 ${
          i < current
            ? "w-4 bg-green-500"
            : i === current
              ? "w-4 bg-green-400"
              : "w-1.5 bg-white/20"
        }`}
      />
    ))}
  </div>
);

export default StepDots;
