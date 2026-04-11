import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [fullName, setFullName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  const fetchUserRole = async (userId) => {
    setRoleLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from("users")
        .select("role, full_name")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Failed to fetch user role:", error.message);
        return;
      }

      if (profile) {
        setRole(profile.role);
        setFullName(profile.full_name);
      }
    } catch (err) {
      console.error("Error fetching user role:", err);
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          fetchUserRole(session.user.id);
        } else {
          setUser(null);
          setRole(null);
          setFullName(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    document.documentElement.classList.remove("dark");
    localStorage.removeItem("yadomanagement-theme");
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, role, fullName, loading, roleLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
