import { useEffect, useState } from "react";
import { collectionGroup, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/useAuth";
import { toast } from "sonner";

export type Ticket = {
  id: string;
  userID: string;
  userEmail: string;
  eventName: string;
  eventId?: string;
  venueId?: string;
  ticketPrice: number;
  purchaseDate: any;
  isUsed: boolean;
  usedAt?: any;
};

export type UserStats = {
  userID: string;
  email: string;
  ticketCount: number;
  totalSpent: number;
  events: string[];
};

export type EventStats = {
  eventName: string;
  ticketCount: number;
  revenue: number;
  usedTickets: number;
};

export type DailySales = {
  date: string;
  tickets: number;
  revenue: number;
};

export type OverviewMetrics = {
  totalTickets: number;
  totalUsers: number;
  totalRevenue: number;
  usedTickets: number;
  usageRate: number;
  avgRevenuePerUser: number;
};

export function useOverviewData() {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [eventStats, setEventStats] = useState<EventStats[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);
  const daysToShow = 90;

  useEffect(() => {
    if (!authLoading && user) {
      loadTicketsAndUsers();
    }
  }, [user, authLoading]);

  async function loadTicketsAndUsers() {
    if (!user) return;
    
    setLoading(true);
    try {
      let allTickets: Ticket[] = [];

      if (user.role === "siteAdmin") {
        const ticketsSnap = await getDocs(collectionGroup(db, "tickets"));
        allTickets = ticketsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Ticket));
      } else if (user.role === "venueAdmin" || user.role === "subAdmin") {
        if (!user.venueId) {
          toast.error("No venue assigned to your account");
          setLoading(false);
          return;
        }

        const ticketsSnap = await getDocs(collectionGroup(db, "tickets"));
        allTickets = ticketsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Ticket)).filter(ticket => ticket.venueId === user.venueId);
      } else {
        setLoading(false);
        return;
      }

      setTickets(allTickets);
      processUserStats(allTickets);
      processEventStats(allTickets);
      processDailySales(allTickets);

    } catch (e: any) {
      toast.error("Failed to load overview: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  function processUserStats(allTickets: Ticket[]) {
    const userMap: Record<string, UserStats> = {};
    allTickets.forEach(t => {
      if (!userMap[t.userID]) {
        userMap[t.userID] = {
          userID: t.userID,
          email: t.userEmail || "Unknown",
          ticketCount: 0,
          totalSpent: 0,
          events: []
        };
      }
      const u = userMap[t.userID];
      u.ticketCount++;
      u.totalSpent += t.ticketPrice || 0;
      if (t.eventName && !u.events.includes(t.eventName)) u.events.push(t.eventName);
    });
    setUsers(Object.values(userMap));
  }

  function processEventStats(allTickets: Ticket[]) {
    const eventMap: Record<string, EventStats> = {};
    allTickets.forEach(t => {
      if (!eventMap[t.eventName]) {
        eventMap[t.eventName] = {
          eventName: t.eventName,
          ticketCount: 0,
          revenue: 0,
          usedTickets: 0
        };
      }
      const e = eventMap[t.eventName];
      e.ticketCount++;
      e.revenue += t.ticketPrice || 0;
      if (t.isUsed) e.usedTickets++;
    });
    setEventStats(Object.values(eventMap).sort((a, b) => b.revenue - a.revenue));
  }

  function processDailySales(allTickets: Ticket[]) {
    const salesMap: Record<string, DailySales> = {};
    const now = new Date();
    
    // Initialize all days for the selected period with 0 values
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      salesMap[dateStr] = {
        date: dateStr,
        tickets: 0,
        revenue: 0
      };
    }

    // Populate with actual ticket data
    allTickets.forEach(ticket => {
      if (ticket.purchaseDate) {
        let purchaseDate: Date;
        
        if (ticket.purchaseDate.toDate) {
          purchaseDate = ticket.purchaseDate.toDate();
        } else if (ticket.purchaseDate instanceof Date) {
          purchaseDate = ticket.purchaseDate;
        } else {
          purchaseDate = new Date(ticket.purchaseDate);
        }
        
        const dateStr = purchaseDate.toISOString().split('T')[0];
        
        if (salesMap[dateStr]) {
          salesMap[dateStr].tickets++;
          salesMap[dateStr].revenue += ticket.ticketPrice || 0;
        }
      }
    });

    // Convert to array and sort by date
    const dailySalesArray = Object.values(salesMap)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(day => ({
        ...day,
        date: new Date(day.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      }));

    setDailySales(dailySalesArray);
  }

  // Computed metrics
  const metrics: OverviewMetrics = {
    totalTickets: tickets.length,
    totalUsers: users.length,
    totalRevenue: users.reduce((sum, u) => sum + u.totalSpent, 0),
    usedTickets: tickets.filter(t => t.isUsed).length,
    usageRate: tickets.length > 0 ? (tickets.filter(t => t.isUsed).length / tickets.length) * 100 : 0,
    avgRevenuePerUser: users.length > 0 ? users.reduce((sum, u) => sum + u.totalSpent, 0) / users.length : 0
  };

  return {
    user,
    authLoading,
    loading,
    tickets,
    users,
    eventStats,
    dailySales,
    metrics
  };
}