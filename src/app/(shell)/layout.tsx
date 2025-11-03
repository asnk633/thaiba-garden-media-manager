"use client";

import React, { useState } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import FABOverlay from "@/components/FABOverlay";
import { ToastProvider } from "@/components/ToastProvider";
import { ClientDataProvider } from "./ClientDataContext";
import { RoleProvider, useRole, type Role } from "./RoleContext";

import CreateTaskModalGuest from "@/components/CreateTaskModalGuest";
import CreateEventModal from "@/components/CreateEventModal";
import CreateNotificationModalAdmin from "@/components/CreateNotificationModalAdmin";
import EditEventModalAdmin from "@/components/EditEventModalAdmin";
import ConfirmDialog from "@/components/ConfirmDialog";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { user } = useRole();
  const role: Role = user.role;

  const [fabOpen, setFabOpen] = useState(false);
  const [openTask, setOpenTask] = useState(false);
  const [openEvent, setOpenEvent] = useState(false);
  const [openNotice, setOpenNotice] = useState(false);
  const [openEditEvent, setOpenEditEvent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="pb-24 pt-2">{children}</main>

      <BottomNav onFabClick={() => setFabOpen(true)} />
      <FABOverlay
        open={fabOpen}
        role={role}
        onClose={() => setFabOpen(false)}
        onSelect={(action) => {
          if (action === "task") setOpenTask(true);
          if (action === "event") setOpenEvent(true);
          if (action === "notice") setOpenNotice(true);
          if (action === "report") window.location.assign("/reports");
        }}
      />

      {/* role-aware creation */}
      <CreateTaskModalGuest open={openTask} onClose={() => setOpenTask(false)} />
      <CreateEventModal open={openEvent} role={role} onClose={() => setOpenEvent(false)} />
      {role === "admin" && (
        <CreateNotificationModalAdmin open={openNotice} onClose={() => setOpenNotice(false)} />
      )}

      {/* examples */}
      <EditEventModalAdmin open={openEditEvent} onClose={() => setOpenEditEvent(false)} />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Event?"
        message="This will permanently remove the event and its associated data."
        confirmText="Delete"
        onConfirm={() => setConfirmDelete(false)}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <RoleProvider>
        <ClientDataProvider>
          <ShellInner>{children}</ShellInner>
        </ClientDataProvider>
      </RoleProvider>
    </ToastProvider>
  );
}
