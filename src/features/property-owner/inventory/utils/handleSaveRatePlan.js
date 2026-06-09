import { toast } from "sonner";

export const handleSaveRatePlan = async ({
  form,
  localId,
  ratePlans,
  roomTypes,
  createRatePlan,
  updateRatePlan,
  setSubmitting,
  handleClose,
}) => {
  setSubmitting(true);
  try {
    if (!localId) {
      const selectedRoomType = roomTypes.find(rt => rt.id === form.roomTypeId);
      if (!selectedRoomType?.channex_room_type_id) {
        throw new Error("Selected room type has no Channex ID. Sync your room types first.");
      }
      await createRatePlan(form, form.roomTypeId, selectedRoomType.channex_room_type_id);
      toast.success("Rate plan created");
    } else {
      const rp = ratePlans.find(r => r.id === localId);
      if (rp) {
        await updateRatePlan(rp.id, rp.channex_rate_plan_id, form);
        toast.success("Rate plan updated");
      }
    }
    handleClose();
  } catch (err) {
    toast.error("Failed to save rate plan", { description: err.message });
  } finally {
    setSubmitting(false);
  }
};
