import { toast } from "sonner";

export const handleDeleteRatePlan = async ({
  rp,
  propertyId,
  deleteRatePlan,
  setSubmitting,
}) => {
  setSubmitting(true);
  try {
    await deleteRatePlan({ localId: rp.id, channexRatePlanId: rp.channex_rate_plan_id, propertyId });
    toast.success("Rate plan deleted");
  } catch (err) {
    toast.error("Failed to delete rate plan", { description: err.message });
  } finally {
    setSubmitting(false);
  }
};
