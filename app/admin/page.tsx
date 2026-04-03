import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import SignOutButton from "@/components/SignOutButton";

const NAV_ITEMS = ["Dashboard", "Companies", "Coaches", "Plans", "Settings"];

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>

      {/* Mobile top bar */}
      <div
        className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-4 md:hidden"
        style={{ height: 52, backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}
      >
        <span className="text-lg font-semibold" style={{ color: "#0D9488" }}>Takt</span>
        <SignOutButton />
      </div>

      {/* Sidebar — hidden on mobile */}
      <aside
        className="hidden w-64 flex-shrink-0 flex-col md:flex"
        style={{
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #E2E8F0",
        }}
      >
        <div className="px-6 py-6">
          <span
            className="text-xl font-semibold"
            style={{ color: "#0D9488" }}
          >
            Takt
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV_ITEMS.map((item, i) => (
            <div
              key={item}
              className="rounded-md px-3 py-2 text-sm"
              style={
                i === 0
                  ? {
                      backgroundColor: "#F0FDFA",
                      color: "#0D9488",
                      fontWeight: 500,
                      borderLeft: "2px solid #0D9488",
                    }
                  : {
                      color: "#64748B",
                      borderLeft: "2px solid transparent",
                    }
              }
            >
              {item}
            </div>
          ))}
        </nav>

        <div className="px-6 py-6" style={{ borderTop: "1px solid #E2E8F0" }}>
          <SignOutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col px-4 py-16 md:px-10 md:py-10" style={{ minWidth: 0 }}>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "#0F172A" }}
        >
          Admin Panel
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#64748B" }}>
          Company management and platform configuration will appear here.
        </p>
      </main>
    </div>
  );
}
