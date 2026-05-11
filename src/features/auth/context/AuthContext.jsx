import { createContext, useContext, useEffect, useRef, useState } from "react";
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

  // Tracks whether the role has already been fetched for the current session.
  // Supabase fires onAuthStateChange multiple times (SIGNED_IN, TOKEN_REFRESHED,
  // visibility changes) — this ref prevents redundant DB calls and the resulting
  // roleLoading=true flash that would unmount and remount the entire layout.
  const roleFetchedRef = useRef(false);

  const fetchUserRole = async (userId) => {
    // Skip if already fetched for this session
    if (roleFetchedRef.current) return;
    roleFetchedRef.current = true;

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
          // Reset so the next sign-in fetches the role fresh
          roleFetchedRef.current = false;
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
