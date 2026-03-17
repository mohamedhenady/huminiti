"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Home, BookOpen } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/batches", label: "الدفعات", icon: Home, roles: ["pharmacy", "huminiti"] },
  { href: "/drugs", label: "الأدوية", icon: BookOpen, roles: ["pharmacy"] },
];

export default function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const visible = navItems.filter((n) => n.roles.includes(user?.role || "huminiti"));

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-40 flex">
      {visible.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors",
              active ? "text-primary" : "text-text-secondary"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
