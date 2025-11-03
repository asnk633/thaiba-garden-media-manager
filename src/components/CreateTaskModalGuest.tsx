"use client";

import { useState } from "react";
import { useClientData } from "@/app/(shell)/ClientDataContext";
import ModalBase from "@/components/ModalBase";

export default function CreateTaskModalGuest({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const { createTask } = useClientData();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const submit = async () => {
    if (!title.trim()) return;
    try { await createTask({ title: title.trim(), description: desc.trim() || "" }); onClose(); setTitle(""); setDesc(""); } catch {}
  };

  return (
    <ModalBase open={open} onClose={onClose} panelClass="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-xl rounded-t-2xl bg-[#102220] p-4">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold">Create a New Task</h3>
        <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
      </header>
      <div className="space-y-6">
        <label className="block">
          <p className="pb-2">Task Title</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 w-full rounded-xl border border-[#316861] bg-[#183430] px-4" />
        </label>
        <label className="block">
          <p className="pb-2">Task Description</p>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="min-h-28 w-full rounded-xl border border-[#316861] bg-[#183430] p-4" />
        </label>
        <div className="pt-2">
          <button onClick={submit} className="grid h-12 w-full place-items-center rounded-xl bg-[#09b39d] font-bold text-black">Submit Task</button>
        </div>
      </div>
    </ModalBase>
  );
}
