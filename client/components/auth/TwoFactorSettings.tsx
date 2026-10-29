"use client";
import React, { useState } from "react";
import { useUserContext } from "@/context/userContext";

// Opt-in email verification: after the password, login asks for a 6-digit emailed code.
function TwoFactorSettings() {
  const { user, setTwoFactor } = useUserContext();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const enabled = !!user?.twoFactorEnabled;

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await setTwoFactor(!enabled, password);
    if (ok) setPassword("");
    setBusy(false);
  };

  return (
    <div className="mt-10 p-6 rounded-lg bg-2 border border-rgba-3">
      <h2 className="text-xl font-semibold text-white">2-step verification</h2>
      <p className="mt-1 text-sm text-gray-400">
        {enabled
          ? "On: after your password, we email a 6-digit code to confirm it is you."
          : "Off: turn on to require an emailed 6-digit code at every login."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Confirm with your password"
          className="flex-1 min-w-[200px] px-3 py-2 border-2 border-rgba-3 rounded-md bg-1 text-white placeholder-gray-400"
        />
        <button
          onClick={toggle}
          disabled={busy}
          className="px-4 py-2 rounded-md bg-[#7263F3] text-white font-semibold hover:bg-[#6FCF97] transition-colors disabled:opacity-50"
        >
          {enabled ? "Turn off" : "Turn on"}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Google-only accounts do not need a password here.
      </p>
    </div>
  );
}

export default TwoFactorSettings;
