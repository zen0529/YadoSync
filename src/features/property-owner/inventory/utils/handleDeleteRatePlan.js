import { toast } from "sonner";

export const handleDeleteRatePlan = async ({
  rp,
  deleteRatePlan,
  setSubmitting,
}) => {
  if (!window.confirm(`Are you sure you want to delete "${rp.title}"?`)) return;
  setSubmitting(true);
  try {
    await deleteRatePlan(rp.id, rp.channex_rate_plan_id);
    toast.success("Rate plan deleted");
  } catch (err) {
    toast.error("Failed to delete rate plan", { description: err.message });
  } finally {
    setSubmitting(false);
  }
};
