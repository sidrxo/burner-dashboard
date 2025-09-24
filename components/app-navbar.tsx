"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Home, Settings, Ticket, Users, MapPin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/useAuth"; // custom hook to get current user with role/venueId
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function AppNavbar() {
  const pathname = usePathname();
  const { user } = useAuth(); // { uid, role, venueId }
  const [venueName, setVenueName] = useState<string>("");

  // Fetch venue name when user changes
  useEffect(() => {
    const fetchVenueName = async () => {
      if (user?.venueId) {
        try {
          const venueDoc = await getDoc(doc(db, "venues", user.venueId));
          if (venueDoc.exists()) {
            setVenueName(venueDoc.data().name);
          }
        } catch (error) {
          console.error("Error fetching venue name:", error);
          setVenueName("");
        }
      } else if (user?.role === "siteAdmin") {
        setVenueName("BURNER");
      } else {
        setVenueName("");
      }
    };

    fetchVenueName();
  }, [user]);

  const navigationItems = [
    { title: "Overview", url: "/overview", icon: Home },
    { title: "Events", url: "/events", icon: Calendar },
    { title: "Tickets", url: "/tickets", icon: Ticket },
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

  // Add "Admin Management" tab for siteAdmins only
  if (user && user.role === "siteAdmin") {
    navigationItems.splice(4, 0, {
      title: "Admin Management",
      url: "/admin-management",
      icon: Shield,
    });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-6 flex h-16 items-center relative">
        {/* Logo with Dynamic Venue Name */}
        <div className="absolute left-6 flex items-center space-x-2">
          <h1 className="text-xl font-bold">{venueName}</h1>
        </div>

        {/* Centered Navigation */}
        <nav className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-6">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.url;
              return (
                <Link key={item.url} href={item.url}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Right side placeholder for balance */}
        <div className="absolute right-6 w-20"></div>
      </div>
    </header>
  );
}