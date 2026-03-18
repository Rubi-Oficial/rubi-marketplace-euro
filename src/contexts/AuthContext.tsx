import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "client" | "professional" | "admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: AppRole | null;
  signOut: () => Promise<void>;
  getDashboardPath: () => string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRole: null,
  signOut: async () => {},
  getDashboardPath: () => "/",
});

export const useAuth = () => useContext(AuthContext);

export function getRoleDashboard(role: AppRole | null): string {
  switch (role) {
    case "admin": return "/admin";
    case "professional": return "/app";
    case "client": return "/cliente";
    default: return "/";
  }
}

export function getRolePrefix(role: AppRole | null): string {
  switch (role) {
    case "admin": return "/admin";
    case "professional": return "/app";
    case "client": return "/cliente";
    default: return "/";
  }
}

async function fetchUserRole(userId: string): Promise<AppRole> {
  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) return "client";
  return (data.role as AppRole) ?? "client";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);

  useEffect(() => {
    // 1. Set up listener FIRST (per Supabase best practices)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Use setTimeout to avoid Supabase deadlock on initial load
          setTimeout(async () => {
            const role = await fetchUserRole(newSession.user.id);
            setUserRole(role);
            setLoading(false);
          }, 0);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // 2. Then check existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        const role = await fetchUserRole(existingSession.user.id);
        setUserRole(role);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
  }, []);

  const getDashboardPath = useCallback(() => {
    return getRoleDashboard(userRole);
  }, [userRole]);

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, signOut, getDashboardPath }}>
      {children}
    </AuthContext.Provider>
  );
}
