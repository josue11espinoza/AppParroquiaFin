import { Church, Users, Calendar, Search, Home, BookOpen, UserCog, LogOut } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Buscar Registros", url: "/search", icon: Search },
  { title: "Feligreses", url: "/parishioners", icon: Users, adminOnly: true },
  { title: "Sacramentos", url: "/sacraments", icon: BookOpen, adminOnly: true },
  { title: "Sacerdotes", url: "/priests", icon: Church, adminOnly: true },
  { title: "Horarios", url: "/schedules", icon: Calendar },
  { title: "Usuarios", url: "/users", icon: UserCog, adminOnly: true },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, isAdmin, isPriest, signOut, userRole } = useAuth();

  const filteredItems = menuItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
            <Church className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold text-sidebar-foreground">
              Parroquia
            </h1>
            <p className="text-xs text-sidebar-foreground/60">
              Sistema de Gestión
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider mb-2">
            Menú Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`w-full transition-all duration-200 ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }`}
                    >
                      <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                        <item.icon className={`w-5 h-5 ${isActive ? "text-sidebar-primary" : ""}`} />
                        <span className="font-medium">{item.title}</span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {user && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="text-sm font-medium text-sidebar-foreground">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.email}
                </p>
                <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs">
                  {isAdmin ? "Admin" : isPriest ? "Padre" : "Sin rol"}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
