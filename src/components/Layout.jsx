import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  User, 
  FolderKanban, 
  CreditCard, 
  FileText, 
  Bell, 
  MessageSquare,
  LogOut,
  Settings, 
  Menu,
  AlertTriangle, // Added for high-priority notifications
  Calendar // Added for renewal notifications
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button"; 
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"; 

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Deliverables", href: "/deliverables", icon: FileText },
  { name: "Renewals", href: "/renewals", icon: Bell },
  { name: "Support", href: "/support", icon: MessageSquare },
];

// Placeholder Data for Notifications
const mockNotifications = [
    { id: 1, title: "Domain renewal due in 7 days", type: "renewal", icon: Calendar, href: "/renewals" },
    { id: 2, title: "Project 'Alpha' status updated", type: "project", icon: FolderKanban, href: "/projects" },
    { id: 3, title: "Payment failure alert!", type: "alert", icon: AlertTriangle, href: "/payments" },
];


export function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "U"; 
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const username = user?.username || "user";

  // TODO: Replace this placeholder count (3) with the actual count from your global state/context
  const renewalCount = mockNotifications.length; 

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar (omitted for brevity, assume unchanged) */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ComData Portal
          </h1>
        </div>
        
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary shadow-md"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-border bg-card-background">
          <h2 className="text-xl font-semibold text-foreground">
            {navigation.find(item => item.href === location.pathname)?.name || "Portal"}
          </h2>
          
          <div className="flex items-center gap-4">
            
            {/* 🔔 Notification Bell Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative h-9 w-9"
                >
                  <Bell className="h-5 w-5 text-foreground" />
                  {/* Conditional Notification Badge for Renewals */}
                  {renewalCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                      {renewalCount > 9 ? "9+" : renewalCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="font-bold text-lg">
                  Notifications ({renewalCount})
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {renewalCount > 0 ? (
                    mockNotifications.map(notification => (
                        <DropdownMenuItem 
                            key={notification.id} 
                            className="flex items-center gap-3 p-3 cursor-pointer"
                            onClick={() => navigate(notification.href)}
                        >
                            <notification.icon 
                                className={cn(
                                    "h-5 w-5",
                                    notification.type === 'renewal' && "text-warning",
                                    notification.type === 'alert' && "text-destructive",
                                    notification.type === 'project' && "text-primary"
                                )}
                            />
                            <span className="truncate">{notification.title}</span>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <DropdownMenuItem className="py-4 text-center text-muted-foreground" disabled>
                        No new notifications
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/notifications")} className="justify-center text-primary">
                    View All Notifications
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dropdown Menu (omitted for brevity, assumed unchanged) */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-auto px-2 flex items-center gap-2">
                    <span className="text-sm font-medium hidden sm:inline text-foreground">
                      @{username}
                    </span>
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white">
                        {getInitials(user?.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email || "No Email"}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}