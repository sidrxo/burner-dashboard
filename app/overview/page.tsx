// Updated overview page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/useAuth";
import RequireAuth from "@/components/require-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  TrendingUp, 
  Users, 
  Ticket, 
  DollarSign, 
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  BarChart3
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Ticket = {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: any;
  venue: string;
  userId: string;
  pricePerTicket: number;
  totalPrice: number;
  purchaseDate: any;
  status: string; // "confirmed", "cancelled", "used"
  qrCode?: string;
  ticketNumber?: string;
};

type UserStats = {
  userId: string;
  ticketCount: number;
  totalSpent: number;
  events: string[];
};

type EventStats = {
  eventName: string;
  venue: string;
  ticketCount: number;
  revenue: number;
  usedTickets: number;
};

type DailySales = {
  date: string;
  tickets: number;
  revenue: number;
};

function OverviewPageContent() {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [eventStats, setEventStats] = useState<EventStats[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);
  const daysToShow = 90; // Static 90 days

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [user, authLoading]);

  async function loadData() {
    if (!user) return;
    
    setLoading(true);
    try {
      let allTickets: Ticket[] = [];
      let allEvents: any[] = [];

      // Load all events first
      const eventsQuery = user.role === "siteAdmin" 
        ? query(collection(db, "events"), orderBy("date", "desc"))
        : query(collection(db, "events"), where("venueId", "==", user.venueId || ""), orderBy("date", "desc"));
      
      const eventsSnap = await getDocs(eventsQuery);
      allEvents = eventsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(allEvents);

      // Load tickets based on events for this venue
      if (user.role === "siteAdmin") {
        // Site admins see all tickets
        const ticketsSnap = await getDocs(collection(db, "tickets"));
        allTickets = ticketsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Ticket));
      } else if (user.role === "venueAdmin" || user.role === "subAdmin") {
        // Venue admins and sub-admins only see tickets for their venue's events
        if (!user.venueId) {
          toast.error("No venue assigned to your account");
          setLoading(false);
          return;
        }

        // Get event IDs for this venue
        const venueEventIds = allEvents.map(event => event.id).filter(Boolean);
        
        if (venueEventIds.length > 0) {
          // Query tickets for events from this venue (using 'in' operator, max 10 at a time)
          const chunks = [];
          for (let i = 0; i < venueEventIds.length; i += 10) {
            chunks.push(venueEventIds.slice(i, i + 10));
          }

          for (const chunk of chunks) {
            const ticketsSnap = await getDocs(
              query(collection(db, "tickets"), where("eventId", "in", chunk))
            );
            const chunkTickets = ticketsSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Ticket));
            allTickets = allTickets.concat(chunkTickets);
          }
        }
      } else {
        // Regular users shouldn't access this page
        setLoading(false);
        return;
      }

      setTickets(allTickets);

      // Process user stats
      const userMap: Record<string, UserStats> = {};
      allTickets.forEach(t => {
        if (!userMap[t.userId]) {
          userMap[t.userId] = {
            userId: t.userId,
            ticketCount: 0,
            totalSpent: 0,
            events: []
          };
        }
        const u = userMap[t.userId];
        u.ticketCount++;
        u.totalSpent += t.totalPrice || 0;
        if (t.eventName && !u.events.includes(t.eventName)) u.events.push(t.eventName);
      });
      setUsers(Object.values(userMap));

      // Process event stats
      const eventMap: Record<string, EventStats> = {};
      allTickets.forEach(t => {
        const key = t.eventName || 'Unknown Event';
        if (!eventMap[key]) {
          eventMap[key] = {
            eventName: t.eventName || 'Unknown Event',
            venue: t.venue || 'Unknown Venue',
            ticketCount: 0,
            revenue: 0,
            usedTickets: 0
          };
        }
        const e = eventMap[key];
        e.ticketCount++;
        e.revenue += t.totalPrice || 0;
        if (t.status === 'used') e.usedTickets++;
      });
      setEventStats(Object.values(eventMap).sort((a, b) => b.revenue - a.revenue));

      // Process daily sales data
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
          
          // Handle different date formats from Firebase
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
            salesMap[dateStr].revenue += ticket.totalPrice || 0;
          }
        }
      });

      // Convert to array and sort by date (oldest first for chart)
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

    } catch (e: any) {
      toast.error("Failed to load overview: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  const totalTickets = tickets.length;
  const totalUsers = users.length;
  const totalRevenue = tickets.reduce((sum, t) => sum + (t.totalPrice || 0), 0);
  const usedTickets = tickets.filter(t => t.status === 'used').length;
  const usageRate = totalTickets > 0 ? (usedTickets / totalTickets) * 100 : 0;
  const avgRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show access denied for users without proper permissions
  if (!user || (user.role !== "siteAdmin" && user.role !== "venueAdmin" && user.role !== "subAdmin")) {
    return (
      <Card className="max-w-md mx-auto mt-10">
        <CardHeader>
          <CardTitle className="text-center">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            You don't have permission to view the dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-[200px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-[100px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[80px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px]" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard Overview
          {user.role !== "siteAdmin" && (
            <span className="text-lg text-muted-foreground font-normal ml-2">
              - Your Venue
            </span>
          )}
        </h1>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Avg per user: {formatCurrency(avgRevenuePerUser)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {usedTickets} used ({usageRate.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {user.role === "siteAdmin" ? "Active customers" : "Your venue customers"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              {user.role === "siteAdmin" ? "Total events created" : "Your venue events"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Ticket Sales Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Daily Ticket Sales
              </CardTitle>
              <CardDescription>
                {user.role === "siteAdmin" 
                  ? "Ticket sales over the last 90 days across all venues"
                  : "Ticket sales for your venue over the last 90 days"
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dailySales} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barCategoryGap="10%"
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'black',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'tickets' ? `${value} tickets` : formatCurrency(value),
                    name === 'tickets' ? 'Tickets Sold' : 'Revenue'
                  ]}
                  labelStyle={{ color: 'black', fontWeight: '500' }}
                  cursor={false}
                  active={undefined}
                  isAnimationActive={false}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length > 0) {
                      const ticketCount = payload[0].value;
                      if (ticketCount === 0) return null;
                      
                      return (
                        <div style={{
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'black',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          padding: '8px 12px'
                        }}>
                          <p style={{ color: 'black', fontWeight: '500', margin: 0 }}>{label}</p>
                          <p style={{ color: 'black', margin: 0 }}>{`${ticketCount} tickets`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="tickets" 
                  fill="#bb86fc" 
                  radius={[2, 2, 0, 0]}
                  name="tickets"
                  maxBarSize={8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Event Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Event Performance</CardTitle>
          <CardDescription>
            {user.role === "siteAdmin" 
              ? "Revenue and ticket sales by event across all venues"
              : "Revenue and ticket sales for your venue events"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventStats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead className="text-right">Tickets Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Usage Rate</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventStats.slice(0, 10).map((event, index) => {
                  const eventUsageRate = event.ticketCount > 0 ? (event.usedTickets / event.ticketCount) * 100 : 0;
                  return (
                    <TableRow key={`${event.eventName}-${index}`}>
                      <TableCell className="font-medium">{event.eventName}</TableCell>
                      <TableCell>{event.venue}</TableCell>
                      <TableCell className="text-right">{event.ticketCount}</TableCell>
                      <TableCell className="text-right">{formatCurrency(event.revenue)}</TableCell>
                      <TableCell className="text-right">{eventUsageRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={index < 3 ? "default" : "secondary"}>
                          {index < 3 ? "Top Performer" : "Active"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              {user.role === "siteAdmin" 
                ? "No events found across any venues"
                : "No events found for your venue"
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Usage Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ticket Usage Rate
          </CardTitle>
          <CardDescription>
            {user.role === "siteAdmin" 
              ? "Overall ticket utilization across all events"
              : "Ticket utilization for your venue events"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Used Tickets</span>
            <span className="text-sm text-muted-foreground">
              {usedTickets} / {totalTickets}
            </span>
          </div>
          <Progress value={usageRate} className="h-2" />
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Used: {usedTickets}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Unused: {totalTickets - usedTickets}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <RequireAuth>
      <OverviewPageContent />
    </RequireAuth>
  );
}