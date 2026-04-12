export const Sparkline = ({ data, warn = false }) => (
  <div className="flex items-end gap-[3px] h-10 mt-3">
    {data.map((h, i) => {
      const isLast = i === data.length - 1;
      const baseColor = warn ? "rgb(244, 63, 94)" : "rgb(34, 197, 94)";
      const opacity = isLast ? 0.8 : 0.15 + (h / 100) * 0.25;

      return (
        <div
          key={i}
          className={`flex-1 rounded-full transition-all duration-500 ${isLast ? "ring-2 ring-offset-1" : ""}`}
          style={{
            height: `${Math.max(h, 8)}%`,
            background: baseColor,
            opacity,
            ringColor: isLast ? (warn ? "rgba(244,63,94,0.3)" : "rgba(34,197,94,0.3)") : "transparent",
            minHeight: 4,
          }}
        />
      );
    })}
  </div>
);
