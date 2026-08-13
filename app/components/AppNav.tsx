import Link from "next/link";
import { Swords } from "lucide-react";
import { getCurrentUser } from "@/app/lib/session";
import { logoutAction } from "@/app/lib/auth-actions";

export default async function AppNav() {
  const user = await getCurrentUser();
  const authed = !!user;

  const links = [
    { href: "/", label: "Home" },
    ...(authed ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ...(authed ? [{ href: "/select", label: "Select" }] : []),
    { href: "/characters", label: "Characters" },
    ...(authed ? [{ href: "/equipment", label: "Equipment" }] : []),
    { href: "/battle", label: "Battle" },
    ...(authed ? [{ href: "/story", label: "Story" }] : []),
    ...(authed ? [{ href: "/status", label: "Status" }] : []),
    ...(!authed ? [{ href: "/login", label: "Login" }, { href: "/register", label: "Register" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/30 bg-white/70 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 text-sm text-blue-900">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg">
            <Swords className="h-5 w-5" />
          </span>
          Anime Battler
        </Link>
        <div className="flex items-center gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 transition-colors hover:bg-blue-600 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          {authed && (
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full px-4 py-2 transition-colors hover:bg-blue-600 hover:text-white"
              >
                Logout
              </button>
            </form>
          )}
        </div>
      </nav>
    </header>
  );
}
