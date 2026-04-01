"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="py-2 text-sm transition-colors"
      style={{ color: "#64748B" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
    >
      Sign out
    </button>
  );
}
