import { testChannelConnection } from "../supabase";

/**
 * Handles testing the channel credentials and managing test feedback state
 * @param {object} params
 * @param {string} params.hotelId
 * @param {string} params.channelId
 * @param {function} params.setTesting
 * @param {function} params.setError
 * @param {function} params.setTested
 */
export const handleTest = async ({
  hotelId,
  channelId,
  setTesting,
  setError,
  setTested,
}) => {
  if (!hotelId || !hotelId.trim()) return;
  setTesting(true);
  setError(null);
  setTested(false);
  try {
    await testChannelConnection({
      channel: channelId,
      hotelId: hotelId.trim(),
    });
    setTested(true);
  } catch (err) {
    setError(err.message);
  } finally {
    setTesting(false);
  }
};
