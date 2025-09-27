import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Home, TrendingUp, Wallet, Radio, Users, Settings, Bell, Menu, Shield, LogOut, Sun, Moon, Monitor, } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { useNotifications } from "@/hooks/useWebSocket";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
const navigationItems = [
    {
        name: "Accueil",
        href: "/",
        icon: Home,
    },
    {
        name: "Projets",
        href: "/projects",
        icon: TrendingUp,
    },
    {
        name: "Portfolio",
        href: "/portfolio",
        icon: Wallet,
    },
    {
        name: "Live",
        href: "/live",
        icon: Radio,
    },
    {
        name: "Social",
        href: "/social",
        icon: Users,
    },
];
export default function Navigation() {
    const [location] = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const { unreadCount } = useNotifications();
    const handleLogout = async () => {
        await logout();
    };
    const getUserInitials = () => {
        if (!user?.firstName && !user?.lastName)
            return "U";
        return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
    };
    const ThemeToggle = () => (<DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-9 px-0">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"/>
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4"/>
          <span>Clair</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4"/>
          <span>Sombre</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4"/>
          <span>Système</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>);
    const UserMenu = () => (<DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl} alt={user?.firstName}/>
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user?.firstName && (<p className="font-medium">
                {user.firstName} {user.lastName}
              </p>)}
            {user?.email && (<p className="w-[200px] truncate text-sm text-muted-foreground">
                {user.email}
              </p>)}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <Settings className="mr-2 h-4 w-4"/>
            <span>Tableau de bord</span>
          </Link>
        </DropdownMenuItem>
        {user?.isAdmin && (<DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield className="mr-2 h-4 w-4"/>
              <span>Administration</span>
            </Link>
          </DropdownMenuItem>)}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4"/>
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>);
    const NavigationLink = ({ item, onClick }) => {
        const isActive = location === item.href;
        return (<Link href={item.href} onClick={onClick}>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
          <item.icon className="h-5 w-5"/>
          <span>{item.name}</span>
        </motion.div>
      </Link>);
    };
    return (<>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/">
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-md flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">V</span>
                </div>
                <span className="font-bold text-xl">VISUAL</span>
              </motion.div>
            </Link>

            {/* Navigation Items */}
            <div className="flex items-center space-x-1">
              {navigationItems.map((item) => (<NavigationLink key={item.name} item={item}/>))}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5"/>
                {unreadCount > 0 && (<Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>)}
              </Button>

              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-md flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">V</span>
                </div>
                <span className="font-bold text-xl">VISUAL</span>
              </div>
            </Link>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-5 w-5"/>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col h-full">
                    {/* User Info */}
                    <div className="flex items-center space-x-3 p-4 border-b border-border">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.profileImageUrl} alt={user?.firstName}/>
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 py-4 space-y-2">
                      {navigationItems.map((item) => (<NavigationLink key={item.name} item={item} onClick={() => setMobileMenuOpen(false)}/>))}
                      
                      <div className="border-t border-border pt-4 mt-4">
                        <NavigationLink item={{
            name: "Tableau de bord",
            href: "/dashboard",
            icon: Settings,
        }} onClick={() => setMobileMenuOpen(false)}/>
                        {user?.isAdmin && (<NavigationLink item={{
                name: "Administration",
                href: "/admin",
                icon: Shield,
            }} onClick={() => setMobileMenuOpen(false)}/>)}
                      </div>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-border pt-4">
                      <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => {
            handleLogout();
            setMobileMenuOpen(false);
        }}>
                        <LogOut className="mr-2 h-4 w-4"/>
                        Déconnexion
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-16"/>
    </>);
}
