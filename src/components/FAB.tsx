"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

type MenuItem = {
  id: string;
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
};

export default function FAB({
  items = [],
  initialOpen = false,
  canCreateEvent = false,
}: {
  items?: MenuItem[];
  initialOpen?: boolean;
  canCreateEvent?: boolean;
}) {
  const [open, setOpen] = React.useState(initialOpen);
  const router = useRouter();

  const list = {
    open: { transition: { staggerChildren: 0.06, when: "beforeChildren" } },
    closed: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
  };
  const item = {
    open: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 520, damping: 30 } },
    closed: { opacity: 0, y: 18, scale: 0.98, transition: { type: "spring", stiffness: 700, damping: 32 } },
  };

  const defaultItems: MenuItem[] = [
    { id: "task", label: "Create Task", onClick: () => router.push("/tasks/new"), icon: <span>✅</span> },
    ...(canCreateEvent ? [{ id: "event", label: "Create Event", onClick: () => router.push("/calendar/new"), icon: <span>🗓️</span> }] : []),
    // Notifications should be available to users who can create them.
    { id: "notice", label: "Create Notification", onClick: () => router.push("/notifications/new"), icon: <span>🔔</span> },
  ];
  const menuItems = items.length ? items : defaultItems;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="fab-backdrop"
            className="fixed inset-0 z-40 bg-black/28"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div
        aria-hidden={false}
        className="fixed left-1/2 z-50 -translate-x-1/2"
        style={{
          /* Anchor menu relative to the bottom nav. Reduce vertical gap so FAB visually sits above nav. */
          bottom: "calc(var(--bottom-nav-height, 22px) + 8px)",
          pointerEvents: "none",
        }}
      >
        {/* menu */}
        <div className="pointer-events-auto flex flex-col items-center mb-3">
          <AnimatePresence initial={false}>
            {open && (
              <motion.ul
                initial="closed"
                animate="open"
                exit="closed"
                variants={list}
                className="flex flex-col items-center gap-3 w-[min(20rem,92vw)]"
                style={{ transformOrigin: "center bottom" }}
              >
                {menuItems.map((it) => (
                  <motion.li key={it.id} variants={item} className="w-full">
                    <button
                      onClick={() => {
                        it.onClick?.();
                        setOpen(false);
                      }}
                      className="w-full rounded-xl shadow-md py-2 px-3 bg-white/6 backdrop-blur-sm flex items-center gap-4 text-sm"
                      style={{ pointerEvents: "auto" }}
                    >
                      <div className="flex-none w-10 h-10 rounded-md bg-white/6 grid place-items-center text-lg">{it.icon ?? "•"}</div>
                      <div className="flex-1 text-white/90 font-medium text-left">{it.label}</div>
                    </button>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* FAB */}
        <div className="pointer-events-auto relative">
          <div className={`absolute inset-0 -z-10 flex items-center justify-center ${open ? "" : "opacity-0"}`} style={{ transform: "translateY(-10px)" }}>
            <span
              className={`block w-20 h-20 rounded-full filter blur-2xl opacity-60 transform transition-opacity duration-300 ${open ? "animate-halo" : "opacity-0"}`}
              style={{
                background: "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.32), rgba(99,102,241,0.06) 40%, rgba(99,102,241,0.02) 70%)",
              }}
            />
          </div>

          <motion.button
            aria-haspopup="true"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((s) => !s)}
            className="thaiba-fab-root relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center focus:outline-none"
            style={{
              background: "linear-gradient(135deg,#6b46c1,#7c3aed)",
              pointerEvents: "auto",
            }}
            whileTap={{ scale: 0.94 }}
          >
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <motion.path
                d={open ? "M5 5 L19 19" : "M5 12 L19 12"}
                stroke="white"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ d: open ? "M5 5 L19 19" : "M5 12 L19 12" }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
              />
              <motion.path
                d={open ? "M19 5 L5 19" : "M12 5 L12 19"}
                stroke="white"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={{ d: open ? "M19 5 L5 19" : "M12 5 L12 19" }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
              />
            </svg>
          </motion.button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes haloPulse {
          0% { transform: scale(1); opacity: 0.55 }
          50% { transform: scale(1.12); opacity: 0.85 }
          100% { transform: scale(1); opacity: 0.55 }
        }
        .animate-halo { animation: haloPulse 1.2s ease-in-out infinite; }
      `}</style>
    </>
  );
}
