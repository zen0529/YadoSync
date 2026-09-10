export const MappingHeader = ({ platformName }) => {
  return (
    <div className="mb-4 pb-3 border-b border-black/5 dark:border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Room &amp; Rate Mapping
          </h3>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Map each {platformName || "OTA"} room to a local Room Type first,
            then pair its rate plans.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MappingHeader;
