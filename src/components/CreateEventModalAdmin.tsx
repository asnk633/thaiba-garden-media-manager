"use client";

import ModalBase from "@/components/ModalBase";

export default function EditEventModalAdmin({ open, onClose }: { open: boolean; onClose: () => void; }) {
  if (!open) return null;
  return (
    <ModalBase open={open} onClose={onClose}>
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold">Edit Event</h3>
        <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
      </header>
      <div className="space-y-6">
        <section className="rounded-lg bg-[#2c2c2c] p-4 shadow-lg">
          <label className="flex flex-col">
            <p className="pb-2 text-base font-bold">Event Title</p>
            <input className="h-12 rounded-lg bg-[#121212] px-4" defaultValue="Quarterly Media Strategy Meeting" />
          </label>
          <label className="mt-4 flex flex-col">
            <p className="pb-2 text-base font-bold">Description</p>
            <textarea rows={4} className="rounded-lg bg-[#121212] p-4" defaultValue="Review of Q3 performance and planning for Q4 content." />
          </label>
        </section>
        <section className="rounded-lg bg-[#2c2c2c] p-4 shadow-lg">
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex min-w-[150px] flex-1 flex-col">
              <p className="pb-2 text-base font-bold">Start Date/Time*</p>
              <input type="datetime-local" defaultValue="2023-10-26T10:00" className="h-12 rounded-lg bg-[#121212] px-4" />
            </label>
            <label className="flex min-w-[150px] flex-1 flex-col">
              <p className="pb-2 text-base font-bold">End Date/Time*</p>
              <input type="datetime-local" defaultValue="2023-10-26T11:30" className="h-12 rounded-lg bg-[#121212] px-4" />
            </label>
          </div>
          <label className="mt-4 flex flex-col">
            <p className="pb-2 text-base font-bold">Location / Meeting Link</p>
            <input defaultValue="https://meet.google.com/tha-iba-grdn" className="h-12 rounded-lg bg-[#121212] px-4" />
          </label>
        </section>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button className="h-12 flex-1 rounded-lg bg-[#00BFA6] font-bold text-black">Save Changes</button>
          <button onClick={onClose} className="h-12 flex-1 rounded-lg border border-white/30">Cancel</button>
        </div>
      </div>
    </ModalBase>
  );
}
