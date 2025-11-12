"use client";

export default function CreateEventModalGuest({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-xl rounded-t-2xl bg-[#1E1E1E] p-4">
        <header className="mb-3">
          <h3 className="text-lg font-bold">Create New Event</h3>
          <p className="mt-1 text-sm text-gray-400">
            Admin will review and assign relevant resources/teams after submission.
          </p>
        </header>

        <div className="space-y-4">
          <label className="block">
            <p className="pb-2 text-gray-300">Event Title</p>
            <input className="h-12 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#00BFA6]/50" />
          </label>
          <label className="block">
            <p className="pb-2 text-gray-300">Description</p>
            <textarea className="min-h-28 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] p-4 text-white focus:outline-none focus:ring-2 focus:ring-[#00BFA6]/50" />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <p className="pb-2 text-gray-300">
                Start Date/Time <span className="ml-1 text-red-400">*</span>
              </p>
              <input type="datetime-local" className="h-12 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 text-white [color-scheme:dark]" />
            </label>
            <label className="block">
              <p className="pb-2 text-gray-300">End Date/Time</p>
              <input type="datetime-local" className="h-12 w-full rounded-lg border border-gray-700 bg-[#1e1e1e] px-4 text-white [color-scheme:dark]" />
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md bg-white/10 px-4 py-2">Cancel</button>
          <button className="rounded-md bg-[#00BFA6] px-4 py-2 font-semibold text-black">Submit</button>
        </div>
      </div>
    </>
  );
}
