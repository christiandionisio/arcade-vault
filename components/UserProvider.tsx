"use client";

import { createContext, useContext, useEffect, useState } from "react";

type User = { name: string };

type UserCtx = {
  user: User | null;
  login: (name: string) => void;
  logout: () => void;
};

const UserContext = createContext<UserCtx>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export default function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("av_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  function login(name: string) {
    const u = { name };
    localStorage.setItem("av_user", JSON.stringify(u));
    setUser(u);
  }

  function logout() {
    localStorage.removeItem("av_user");
    setUser(null);
  }

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}
