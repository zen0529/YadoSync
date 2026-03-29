export const Sparkline = ({ data, warn = false }) => (
  <div className="flex items-end gap-0.5 h-8 mt-2">
    {data.map((h, i) => (
      <div key={i} className="flex-1 rounded-sm"
        style={{
          height: `${h}%`,
          background: warn
            ? i === data.length - 1 ? "rgba(217,119,6,0.5)" : "rgba(217,119,6,0.2)"
            : i === data.length - 1 ? "#3aab4a" : "rgba(58,171,74,0.2)",
        }} />
    ))}
  </div>
);
