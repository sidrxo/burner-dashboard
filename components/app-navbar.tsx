"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Home, Settings, Ticket, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/useAuth"; // custom hook to get current user with role/venueId

export function AppNavbar() {
  const pathname = usePathname();
  const { user } = useAuth(); // { uid, role, venueId }

  const navigationItems = [
    { title: "Overview", url: "/overview", icon: Home },
    { title: "Events", url: "/events", icon: Calendar },
    { title: "Tickets", url: "/tickets", icon: Ticket },
    { title: "Users", url: "/users", icon: Users },
    { title: "Account", url: "/account", icon: Settings },
  ];

  // Conditionally add "Venues" tab for siteAdmins and venueAdmins
  if (user && (user.role === "siteAdmin" || user.role === "venueAdmin")) {
    navigationItems.splice(3, 0, {
      title: "Venues",
      url: "/venues",
      icon: MapPin,
    });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-6 flex h-16 items-center relative">
        {/* Logo */}
        <div className="absolute left-6 flex items-center space-x-2">
          <h1 className="text-xl font-bold">Burner Management</h1>
        </div>

        {/* Centered Navigation */}
        <div className="flex-1 flex justify-center">
          <nav className="flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = pathname.startsWith(item.url);
              return (
                <Link key={item.title} href={item.url}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2 px-4"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
