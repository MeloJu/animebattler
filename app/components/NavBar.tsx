"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/select", label: "Select" },
  { href: "/characters", label: "Characters" },
  { href: "/equipment", label: "Equipment" },
  { href: "/battle", label: "Battle" },
  { href: "/status", label: "Status" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
  { href: "/logout", label: "Logout" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/80 border-b border-black/5">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg text-[color:var(--foreground)]">Anime Battler</Link>
        <div className="flex items-center gap-2">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link rounded-md px-3 py-1.5 text-sm transition-colors ${active ? 'bg-[color:var(--ring)]/30' : 'hover:bg-[color:var(--ring)]/20'}`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
