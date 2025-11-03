"use client";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed inset-0 z-[100] grid place-items-center p-4">
        <div className="w-full max-w-sm rounded-xl bg-[#0f2320]/95 p-6 shadow-2xl">
          <div className="mb-3 grid place-items-center">
            <div className="grid size-14 place-items-center rounded-full bg-red-900/40 text-red-400">
              <span className="material-symbols-outlined text-3xl">delete</span>
            </div>
          </div>
          <h3 className="text-center text-[22px] font-bold">{title}</h3>
          {message && <p className="mt-2 text-center text-zinc-300">{message}</p>}

          <div className="mt-5 grid gap-3">
            <button onClick={onConfirm} className="h-12 rounded-lg bg-red-600 font-bold"> {confirmText} </button>
            <button onClick={onCancel} className="h-12 rounded-lg bg-white/10"> {cancelText} </button>
          </div>
        </div>
      </div>
    </>
  );
}
