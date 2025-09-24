import { useEffect, useState } from "react";
import { collectionGroup, getDocs, updateDoc, Timestamp } from "firebase/firestore";
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
  docRef?: any;
};

export type EventGroup = {
  eventName: string;
  eventId?: string;
  tickets: Ticket[];
  totalRevenue: number;
  usedCount: number;
  totalCount: number;
};

export type TicketsStats = {
  totalTickets: number;
  usedTickets: number;
  totalRevenue: number;
  activeEvents: number;
};

export function useTicketsData() {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');

  useEffect(() => {
    if (!authLoading && user) {
      loadTickets();
    }
  }, [user, authLoading]);

  const loadTickets = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const snap = await getDocs(collectionGroup(db, "tickets"));
      let allTickets = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          docRef: doc.ref,
          ...data,
          // Ensure ticketPrice is always a valid number
          ticketPrice: typeof data.ticketPrice === 'number' && !isNaN(data.ticketPrice) ? data.ticketPrice : 0,
        } as Ticket;
      });

      // Filter by venue for venue admins and sub-admins
      if (user.role === "venueAdmin" || user.role === "subAdmin") {
        if (!user.venueId) {
          toast.error("No venue assigned to your account");
          setLoading(false);
          return;
        }
        allTickets = allTickets.filter(ticket => ticket.venueId === user.venueId);
      }

      setTickets(allTickets);
      groupTicketsByEvent(allTickets);
    } catch (e: any) {
      toast.error("Failed to load tickets: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const groupTicketsByEvent = (ticketList: Ticket[]) => {
    const groups: Record<string, EventGroup> = {};
    
    ticketList.forEach(ticket => {
      const eventKey = ticket.eventName || 'Unknown Event';
      
      if (!groups[eventKey]) {
        groups[eventKey] = {
          eventName: eventKey,
          eventId: ticket.eventId,
          tickets: [],
          totalRevenue: 0,
          usedCount: 0,
          totalCount: 0,
        };
      }
      
      const group = groups[eventKey];
      group.tickets.push(ticket);
      // Safely add ticketPrice with fallback to 0
      const price = typeof ticket.ticketPrice === 'number' && !isNaN(ticket.ticketPrice) ? ticket.ticketPrice : 0;
      group.totalRevenue += price;
      group.totalCount++;
      if (ticket.isUsed) {
        group.usedCount++;
      }
    });

    // Sort groups by total revenue (highest first)
    const sortedGroups = Object.values(groups).sort((a, b) => b.totalRevenue - a.totalRevenue);
    setEventGroups(sortedGroups);
  };

  const filteredEventGroups = eventGroups.filter(group => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      group.eventName.toLowerCase().includes(searchLower) ||
      group.tickets.some(ticket => 
        ticket.userEmail?.toLowerCase().includes(searchLower) ||
        ticket.userID?.toLowerCase().includes(searchLower)
      )
    );
  });

  const filteredTickets = tickets.filter(t => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      t.userEmail?.toLowerCase().includes(searchLower) ||
      t.eventName?.toLowerCase().includes(searchLower) ||
      t.userID?.toLowerCase().includes(searchLower)
    );
  });

  const markUsed = async (ticket: Ticket) => {
    if (ticket.isUsed) return;
    try {
      if (ticket.docRef) {
        await updateDoc(ticket.docRef, { isUsed: true, usedAt: Timestamp.now() });
      }
      toast.success("Ticket marked as used!");
      loadTickets();
    } catch (e: any) {
      toast.error("Error updating ticket: " + e.message);
    }
  };

  const toggleEventExpansion = (eventName: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventName)) {
      newExpanded.delete(eventName);
    } else {
      newExpanded.add(eventName);
    }
    setExpandedEvents(newExpanded);
  };

  const stats: TicketsStats = {
    totalTickets: tickets.length,
    usedTickets: tickets.filter(t => t.isUsed).length,
    // Safely calculate total revenue with proper null checking
    totalRevenue: tickets.reduce((sum, t) => {
      const price = typeof t.ticketPrice === 'number' && !isNaN(t.ticketPrice) ? t.ticketPrice : 0;
      return sum + price;
    }, 0),
    activeEvents: eventGroups.length
  };

  return {
    user,
    authLoading,
    tickets,
    eventGroups,
    loading,
    search,
    setSearch,
    expandedEvents,
    viewMode,
    setViewMode,
    filteredEventGroups,
    filteredTickets,
    markUsed,
    toggleEventExpansion,
    loadTickets,
    stats
  };
}