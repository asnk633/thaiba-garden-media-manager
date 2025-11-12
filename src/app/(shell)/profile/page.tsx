"use client";

export default function ProfilePage() {
  return (
    <div className="px-4 pb-28">
      {/* Header */}
      <div className="mt-6 grid place-items-center">
        <div
          className="h-32 w-32 rounded-full border-4 border-[#00BFA6] bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://lh3.googleusercontent.com/aida-public/AB6AXuCwQnBcwTpNbUqsgEo_T9u7O62z9YzvsbL1nqUoV4LnKpLBgD7a9U1rFJ8Xtm8vNB3TTw_iGjCpBCaQ6OdqF21DsDfwSZhtAhZ_kqnNn_u6G1dOqjM-7_f9PIdZZke5KlOFkNVPVVHcvgnbODtRUnuxcHAKqKIMfZZZbekp5-vfOzo8QLn7W7-Qr_uPPFH2PBwIBCMJGbr5WnPcihCN-bKkCccudPFOy58w1fU8ZtkdjvPoD7uPrkP9DaXJzb9gszG-wfLIH10R8Dzi)",
          }}
        />
        <div className="mt-3 text-center">
          <p className="text-[22px] font-bold leading-tight">Jordan Smith</p>
          <p className="text-[#A0A0A0]">Media Manager</p>
        </div>
        <button className="mt-4 w-full max-w-sm rounded-lg bg-[#00BFA6] px-4 py-2 font-bold text-black">
          Edit Profile
        </button>
      </div>

      {/* Account */}
      <div className="mt-6 rounded-xl bg-[#1E1E1E] p-4 shadow-lg">
        <h3 className="mb-4 text-lg font-bold">Account Information</h3>
        {[
          ["Email", "jordan.s@thaibagarden.com"],
          ["Phone", "+1 (555) 123-4567"],
          ["Password", "Change Password"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border-b border-white/10 py-3 last:border-b-0">
            <div>
              <p className="text-white">{k}</p>
              <p className="text-sm text-[#A0A0A0]">{v}</p>
            </div>
            <span className="material-symbols-outlined text-[#A0A0A0]">chevron_right</span>
          </div>
        ))}
      </div>

      {/* App Settings */}
      <div className="mt-6 rounded-xl bg-[#1E1E1E] p-4 shadow-lg">
        <h3 className="mb-4 text-lg font-bold">Application Settings</h3>
        <div className="flex items-center justify-between py-2">
          <p>Push Notifications</p>
          <input type="checkbox" defaultChecked className="h-5 w-10 accent-[#00BFA6]" />
        </div>
        <div className="flex items-center justify-between py-2">
          <p>Dark Mode</p>
          <input type="checkbox" defaultChecked className="h-5 w-10 accent-[#00BFA6]" />
        </div>
      </div>
    </div>
  );
}
