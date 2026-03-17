"use client";
import { useAuth } from "@/lib/auth-context";

interface TopBarProps {
  title: string;
  breadcrumb?: { label: string; href?: string }[];
}

export default function TopBar({ title, breadcrumb }: TopBarProps) {
  const { user, isPharmacy } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-border px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-text-primary">{title}</h1>
        {breadcrumb && (
          <p className="text-xs text-text-secondary mt-0.5">
            {breadcrumb.map((b, i) => (
              <span key={i}>
                {i > 0 && " ← "}
                {b.label}
              </span>
            ))}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-left hidden sm:block">
          <p className="text-sm font-semibold text-text-primary">{user?.full_name || user?.email}</p>
          <p className="text-xs text-text-secondary">{isPharmacy ? "صيدلية السعوي" : "هيومنيتي"}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {user?.full_name?.[0] || user?.email?.[0] || "؟"}
        </div>
      </div>
    </header>
  );
}
