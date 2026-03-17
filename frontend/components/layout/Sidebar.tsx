"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Home, BookOpen, LogOut, Pill } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/batches", label: "الدفعات", icon: Home, roles: ["pharmacy", "huminiti"] },
  { href: "/drugs", label: "قاموس الأدوية", icon: BookOpen, roles: ["pharmacy"] },
];

export default function Sidebar() {
  const { user, isPharmacy, logout } = useAuth();
  const pathname = usePathname();

  const visibleItems = navItems.filter((n) =>
    n.roles.includes(user?.role || "huminiti")
  );

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-l border-border fixed right-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary leading-tight">صيدلية السعوي</p>
            <p className="text-xs text-text-secondary">× هيومنيتي</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:bg-background hover:text-text-primary"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {user?.full_name?.[0] || user?.email?.[0] || "؟"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {user?.full_name || user?.email}
            </p>
            <p className="text-xs text-text-secondary">
              {isPharmacy ? "صيدلية السعوي" : "هيومنيتي"}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
