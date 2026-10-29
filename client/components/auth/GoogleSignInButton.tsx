"use client";
import React, { useEffect, useRef } from "react";
import { useUserContext } from "@/context/userContext";
import { useTheme } from "@/context/themeContext";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";

declare global {
  interface Window {
    google?: any;
  }
}

// "Continue with Google" using Google Identity Services (OpenID Connect ID token).
// Renders nothing when NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set, so the
// email/password flow keeps working without any Google configuration.
function GoogleSignInButton() {
  const { googleLogin } = useUserContext();
  const { theme } = useTheme();
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const render = () => {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) =>
          googleLogin(response.credential),
      });
      buttonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: theme === "dark" ? "filled_black" : "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 320,
      });
    };

    if (window.google) {
      render();
      return;
    }

    let script = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
    script.addEventListener("load", render);
    return () => script?.removeEventListener("load", render);
  }, [theme]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-gray-400 text-sm">
        <span className="flex-1 h-px bg-rgba-2" />
        or
        <span className="flex-1 h-px bg-rgba-2" />
      </div>
      <div ref={buttonRef} className="mt-4 flex justify-center" />
    </div>
  );
}

export default GoogleSignInButton;
