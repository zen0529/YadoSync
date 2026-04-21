import { supabase } from "@/lib/supabase";

export const fetchUserProfile = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const updateProfile = async ({ email }) => {
  const { data, error } = await supabase.auth.updateUser({
    email,
  });
  if (error) throw error;
  return data;
};

export const updatePassword = async ({ newPassword }) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
  return data;
};

export const fetchNotificationPreferences = async (userId) => {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("email_notifications, sms_notifications")
    .eq("user_id", userId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data || { email_notifications: true, sms_notifications: true };
};

export const upsertNotificationPreferences = async ({ userId, emailNotifications, smsNotifications }) => {
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        email_notifications: emailNotifications,
        sms_notifications: smsNotifications,
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const signOutAllSessions = async () => {
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) throw error;
};

export const fetchMyProperty = async (userId) => {
  const { data, error } = await supabase
    .from("properties")
    .select("name, location, owner_name, owner_email, owner_phone")
    .eq("user_id", userId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data || null;
};

export const addMyProperty = async (userId, { name, propertyType, currency, address, city, state, country, postcode, ownerName, ownerEmail, ownerPhone, beds24PropertyId, beds24Name }) => {
  const { data, error } = await supabase
    .from("properties")
    .insert({
      user_id: userId,
      name,
      property_type: propertyType,
      currency,
      location: address,
      city,
      state,
      country,
      postcode,
      owner_name: ownerName,
      owner_email: ownerEmail,
      owner_phone: ownerPhone,
      beds24_property_id: beds24PropertyId,
      beds24_name: beds24Name,
      status: "setup",
    })
    .select("name, location, owner_name, owner_email, owner_phone")
    .single();
  if (error) throw error;
  return data;
};

export const updateMyProperty = async (userId, { name, location, ownerName, ownerEmail, ownerPhone }) => {
  const { data, error } = await supabase
    .from("properties")
    .update({
      name,
      location,
      owner_name: ownerName,
      owner_email: ownerEmail,
      owner_phone: ownerPhone,
    })
    .eq("user_id", userId)
    .select("name, location, owner_name, owner_email, owner_phone")
    .single();
  if (error) throw error;
  return data;
};
