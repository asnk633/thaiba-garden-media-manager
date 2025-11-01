// src/hooks/useAuth.ts
"use client";

/**
 * Thin re-export so components can import from "@/hooks/useAuth"
 * while your actual implementation lives in src/contexts/AuthContext.tsx
 */
export { useAuth } from "@/contexts/AuthContext";
export default useAuth;
