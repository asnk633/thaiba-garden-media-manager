"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type Role = "admin" | "team" | "guest";
type User = { id: string; name: string; role: Role };

type Ctx = {
  user: User;
  setRole: (r: Role) => void;
};

const RoleCtx = createContext<Ctx | null>(null);

export function useRole() {
  const v = useContext(RoleCtx);
  if (!v) throw new Error("useRole must be used within <RoleProvider>");
  return v;
}

// Defaults: you can wire to real auth later.
const DEFAULT_USERS: Record<Role, User> = {
  admin: { id: "u3", name: "Shukoor Rahman", role: "admin" },
  team:  { id: "u2", name: "KMS Pallikkunnu", role: "team" },
  guest: { id: "u1", name: "Anu MadMax", role: "guest" },
};

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("admin");
  const user = useMemo(() => DEFAULT_USERS[role], [role]);

  const value = useMemo(() => ({ user, setRole }), [user]);

  return <RoleCtx.Provider value={value}>{children}</RoleCtx.Provider>;
}
