import { useState, useEffect } from "react";
import { getProperties } from "../supabase/getProperties";

export const useProperties = (searchQuery = "", statusFilter = "all") => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const data = await getProperties(searchQuery, statusFilter);
        setProperties(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [searchQuery, statusFilter]);

  return { properties, loading, error };
};
