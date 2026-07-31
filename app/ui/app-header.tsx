"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { href: "/", label: "Agenda" },
  { href: "/rooms", label: "Salas" },
  { href: "/reservations", label: "Reservas" },
  { href: "/docs", label: "API" },
];

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200/80 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/" className="font-semibold tracking-tight">
            Reserva de Salas
          </Link>
          <p className="text-xs text-zinc-500">Gestão de espaços</p>
        </div>

        <nav aria-label="Navegação principal">
          <ul className="flex flex-wrap gap-1 rounded-xl bg-zinc-100 p-1">
            {navigationItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-white text-orange-700 shadow-sm"
                        : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
