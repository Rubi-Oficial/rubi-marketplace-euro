import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
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

/** @deprecated Use getRoleDashboard instead */
export const getRolePrefix = getRoleDashboard;

async function fetchUserRole(userId: string): Promise<AppRole | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("[AuthContext] Failed to fetch user role:", error.message);
      return null;
    }
    return (data?.role as AppRole) ?? null;
  } catch (err) {
    console.error("[AuthContext] Unexpected error fetching role:", err);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const roleFetchedForUser = useRef<string | null>(null);

  useEffect(() => {
    let initialSessionHandled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          if (roleFetchedForUser.current === newSession.user.id) {
            setLoading(false);
            return;
          }
          roleFetchedForUser.current = newSession.user.id;
          const role = await fetchUserRole(newSession.user.id);
          setUserRole(role);
          setLoading(false);
        } else {
          roleFetchedForUser.current = null;
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (initialSessionHandled) return;
      initialSessionHandled = true;

      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        if (roleFetchedForUser.current !== existingSession.user.id) {
          roleFetchedForUser.current = existingSession.user.id;
          const role = await fetchUserRole(existingSession.user.id);
          setUserRole(role);
        }
      }
      setLoading(false);
    }).catch((err) => {
      console.error("[AuthContext] Failed to get session:", err);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[AuthContext] Sign out error:", err);
    } finally {
      setUser(null);
      setSession(null);
      setUserRole(null);
      roleFetchedForUser.current = null;
    }
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
