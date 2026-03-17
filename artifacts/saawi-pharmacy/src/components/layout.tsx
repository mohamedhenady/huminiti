import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Package, Pill, LogOut, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger
} from "@/components/ui/sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isPharmacy = user?.role === "pharmacy";

  const navItems = [
    { name: "الدفعات", path: "/batches", icon: Package },
    ...(isPharmacy ? [{ name: "قاموس الأدوية", path: "/drugs", icon: Pill }] : []),
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden" dir="rtl">
        {/* Desktop & Collapsible Sidebar */}
        <Sidebar side="right" className="border-l border-border/50">
          <SidebarHeader className="p-6 border-b border-border/50">
            <h2 className="text-xl font-bold text-primary flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-xl text-primary">
                <Pill className="w-6 h-6" />
              </div>
              صيدلية السعوي
            </h2>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="gap-2">
                  {navItems.map(item => {
                    const isActive = location.startsWith(item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild isActive={isActive} className={`py-6 px-4 rounded-xl transition-all ${isActive ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary hover:text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                          <Link href={item.path} className="flex items-center gap-3 font-semibold text-base">
                            <item.icon className="w-5 h-5" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-border/50 p-4">
            <div className="bg-muted/50 rounded-2xl p-4 flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-foreground truncate">{user?.displayName}</span>
                <span className="text-xs text-muted-foreground truncate">{isPharmacy ? 'إدارة الصيدلية' : 'مؤسسة إنسانية'}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 h-12 rounded-xl" onClick={logout}>
              <LogOut className="w-5 h-5 ml-2" />
              تسجيل الخروج
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0 bg-background">
          <header className="md:hidden flex items-center justify-between p-4 border-b border-border/50 bg-card shadow-sm z-20">
            <div className="flex items-center gap-3">
              <SidebarTrigger>
                <Menu className="w-6 h-6 text-foreground" />
              </SidebarTrigger>
              <h1 className="font-bold text-lg text-primary">صيدلية السعوي</h1>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8 relative">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 flex justify-around p-2 pb-safe">
          {navItems.map(item => {
            const isActive = location.startsWith(item.path);
            return (
              <Link key={item.path} href={item.path} className={`flex flex-col items-center p-3 gap-1 rounded-xl transition-colors min-w-[70px] ${isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                <item.icon className={`w-6 h-6 ${isActive ? 'drop-shadow-sm' : ''}`} />
                <span className="text-[11px] font-bold">{item.name}</span>
              </Link>
            );
          })}
          <button onClick={logout} className="flex flex-col items-center p-3 gap-1 rounded-xl text-destructive min-w-[70px] hover:bg-destructive/10 transition-colors">
            <LogOut className="w-6 h-6" />
            <span className="text-[11px] font-bold">خروج</span>
          </button>
        </nav>
      </div>
    </SidebarProvider>
  );
}
