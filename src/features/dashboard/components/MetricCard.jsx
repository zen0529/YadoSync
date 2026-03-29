import { Card, CardContent } from "@/components/ui/card";
import { Sparkline } from "./Sparkline";
import { SPARK_DATA } from "../data/constants";

export const MetricCard = ({ label, value, trend, warn = false, sparkKey }) => (
  <Card className="border border-black/5 shadow-sm">
    <CardContent className="pt-5 pb-4 px-5">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-3xl font-bold leading-none ${warn ? "text-amber-600" : "text-foreground"}`}>{value}</p>
      <p className={`text-xs mt-1.5 ${warn ? "text-amber-500" : "text-green-600"}`}>{trend}</p>
      <Sparkline data={SPARK_DATA[sparkKey]} warn={warn} />
    </CardContent>
  </Card>
);
