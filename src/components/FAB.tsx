// src/components/FAB.tsx
"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Plus } from "lucide-react";

/**
 * Floating Action Button (FAB)
 * - Fixed centered above bottom nav using CSS var --bottom-nav-height
 * - Rotates the plus to an X (45deg) when open
 * - Slight scale pulse when opening (1.05x)
 * - Prevents layout shift (uses fixed positioning)
 */
export default function FAB() {
  const [open, setOpen] = useState(false);

  // Container for the FAB and optional menu items
  const containerStyle: React.CSSProperties = {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 60,
    // anchor above bottom nav. bottom-nav height var expected in CSS
    bottom: "calc(var(--bottom-nav-height, 22px) + 18px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    pointerEvents: "none", // allow specific children to receive pointer events
  };

  const fabButtonVariants: Variants = {
    closed: { rotate: 0, scale: 1, transition: { type: "spring", stiffness: 380, damping: 26 } },
    open: {
      rotate: 45,
      scale: 1.05, // slight bounce
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 18,
      },
    },
  };

  const menuItemVariants: Variants = {
    closed: { opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.18 } },
    open: (i = 1) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { delay: i * 0.04, type: "spring", stiffness: 300, damping: 24 },
    }),
  };

  // Example menu items (wire up handlers to open forms, navigate, etc.)
  const items = [
    { id: "task", label: "Create Task", onClick: () => console.log("create task") },
    { id: "event", label: "Create Event", onClick: () => console.log("create event") },
    { id: "notify", label: "Create Notification", onClick: () => console.log("create notif") },
  ];

  return (
    <div style={containerStyle} aria-hidden={false}>
      {/* Menu items (rendered above the FAB) */}
      <div style={{ pointerEvents: open ? "auto" : "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <motion.ul style={{ listStyle: "none", padding: 0, margin: 0 }} initial={false} animate={open ? "open" : "closed"}>
          {items.map((it, idx) => (
            <motion.li
              key={it.id}
              custom={idx + 1}
              variants={menuItemVariants}
              style={{
                width: 260,
                maxWidth: "80vw",
                background: "rgba(10,10,10,0.6)",
                padding: "12px 16px",
                borderRadius: 10,
                boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
                color: "white",
                marginBottom: 8,
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* placeholder icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14"></path>
                  <path d="M5 12h14"></path>
                </svg>
              </div>
              <button
                onClick={() => it.onClick()}
                style={{ all: "unset", color: "white", cursor: "pointer", fontWeight: 600 }}
                aria-label={it.label}
              >
                {it.label}
              </button>
            </motion.li>
          ))}
        </motion.ul>
      </div>

      {/* FAB button */}
      <motion.button
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        initial={false}
        animate={open ? "open" : "closed"}
        style={{
          pointerEvents: "auto",
          width: 64,
          height: 64,
          borderRadius: "999px",
          border: "none",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg,#7645f8,#6b2fe8)",
          boxShadow: "0 12px 30px rgba(30, 22, 80, 0.5), inset 0 -6px 12px rgba(0,0,0,0.2)",
          cursor: "pointer",
        }}
        variants={fabButtonVariants}
      >
        <motion.span style={{ width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Plus size={20} color="white" />
        </motion.span>
      </motion.button>
    </div>
  );
}