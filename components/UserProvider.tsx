"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type User = {
  id: string;
  email: string;
  display_name: string;
};

type UserCtx = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserCtx>({
  user: null,
  loading: true,
  logout: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

function deriveDisplayName(
  supabaseUser: { email?: string; user_metadata?: Record<string, string> },
  provider?: string,
): string {
  const meta = supabaseUser.user_metadata ?? {};
  const emailPrefix = (supabaseUser.email ?? "").split("@")[0];

  if (provider === "google") return meta.full_name || emailPrefix;
  if (provider === "github") return meta.user_name || emailPrefix;
  return meta.display_name || emailPrefix;
}

export default function UserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const su = session.user;
        const provider = su.app_metadata?.provider;
        setUser({
          id: su.id,
          email: su.email ?? "",
          display_name: deriveDisplayName(su, provider),
        });
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const su = session.user;
        const provider = su.app_metadata?.provider;
        setUser({
          id: su.id,
          email: su.email ?? "",
          display_name: deriveDisplayName(su, provider),
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <UserContext.Provider value={{ user, loading, logout }}>
      {children}
    </UserContext.Provider>
  );
}
