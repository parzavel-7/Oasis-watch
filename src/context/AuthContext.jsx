import { createContext, useContext, useEffect, useState } from "react";
import { supabase, getCurrentUser } from "../supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUserStatus = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout error:", error);
    setUser(null);
  };

  const register = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      if (error) throw error;
      
      // If session is null, it means email confirmation is required
      return { 
        success: true, 
        session: data.session,
        message: data.session ? "Registration successful!" : "Please check your email to confirm your account."
      };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout: handleLogout, setUser, checkUserStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
