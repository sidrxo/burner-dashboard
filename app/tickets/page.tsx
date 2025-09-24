"use client";
import { useState, useCallback } from "react";
import { collection, getDocs, updateDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/useAuth";
import RequireAuth from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDateSafe } from "@/lib/utils";
import { 
  Ticket as TicketIcon, 
  RefreshCw, 
  Search, 
  CheckCircle, 
  Clock, 
  Users,
  Calendar,
  MapPin,
  TrendingUp,
  XCircle,
  Eye,
  MoreHorizontal
} from "lucide-react";

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
  status: string;
  qrCode?: string;
  ticketNumber?: string;
  venueId?: string;
  docRef?: any;
};

type EventGroup = {
  eventName: string;
  eventId?: string;
  venue?: string;
  tickets: Ticket[];
  totalRevenue: number;
  usedCount: number;
  confirmedCount: number;
  cancelledCount: number;
  totalCount: number;
};

function EventDetailsModal({ eventGroup, onMarkUsed }: { 
  eventGroup: EventGroup; 
  onMarkUsed: (ticket: Ticket) => void;
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'used':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Used
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      case 'confirmed':
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Active
          </Badge>
        );
    }
  };

  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {eventGroup.eventName}
        </DialogTitle>
        {eventGroup.venue && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {eventGroup.venue}
          </p>
        )}
      </DialogHeader>
      
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{eventGroup.totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Used</p>
              <p className="text-xl font-bold text-green-600">{eventGroup.usedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-xl font-bold">£{eventGroup.totalRevenue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Usage</p>
              <p className="text-xl font-bold">
                {eventGroup.totalCount > 0 
                  ? Math.round((eventGroup.usedCount / eventGroup.totalCount) * 100) 
                  : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Ticket #</TableHead>
            <TableHead>Purchase Date</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {eventGroup.tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>
                <div className="font-mono text-sm">
                  {ticket.userId}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-mono text-sm">
                  {ticket.ticketNumber || 'N/A'}
                </div>
              </TableCell>
              <TableCell>
                {formatDateSafe(ticket.purchaseDate)}
              </TableCell>
              <TableCell>
                £{(ticket.totalPrice || ticket.pricePerTicket || 0).toFixed(2)}
              </TableCell>
              <TableCell>
                {getStatusBadge(ticket.status)}
              </TableCell>
              <TableCell>
                {ticket.status === 'used' || ticket.status === 'cancelled' ? (
                  <Button variant="ghost" size="sm" disabled>
                    {ticket.status === 'used' ? 'Used' : 'Cancelled'}
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Mark Used
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Mark Ticket as Used</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to mark this ticket as used? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onMarkUsed(ticket)}>
                          Mark as Used
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DialogContent>
  );
}

function TicketsPageContent() {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<'events' | 'tickets'>('events');
  const [initialized, setInitialized] = useState(false);

  const groupTicketsByEvent = useCallback((ticketList: Ticket[]) => {
    const groups: Record<string, EventGroup> = {};
    
    ticketList.forEach(ticket => {
      const eventKey = ticket.eventName || 'Unknown Event';
      
      if (!groups[eventKey]) {
        groups[eventKey] = {
          eventName: eventKey,
          eventId: ticket.eventId,
          venue: ticket.venue,
          tickets: [],
          totalRevenue: 0,
          usedCount: 0,
          confirmedCount: 0,
          cancelledCount: 0,
          totalCount: 0,
        };
      }
      
      const group = groups[eventKey];
      group.tickets.push(ticket);
      group.totalRevenue += ticket.totalPrice || ticket.pricePerTicket || 0;
      group.totalCount++;
      
      switch (ticket.status) {
        case 'used':
          group.usedCount++;
          break;
        case 'confirmed':
          group.confirmedCount++;
          break;
        case 'cancelled':
          group.cancelledCount++;
          break;
      }
    });

    const sortedGroups = Object.values(groups).sort((a, b) => b.totalRevenue - a.totalRevenue);
    setEventGroups(sortedGroups);
  }, []);

  const loadTickets = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let ticketsQuery;

      if (user.role === "siteAdmin") {
        ticketsQuery = collection(db, "tickets");
      } else if (user.role === "venueAdmin" || user.role === "subAdmin") {
        if (!user.venueId) {
          toast.error("No venue assigned to your account");
          setLoading(false);
          return;
        }
        ticketsQuery = query(
          collection(db, "tickets"),
          where("venueId", "==", user.venueId)
        );
      } else {
        toast.error("You don't have permission to view tickets");
        setLoading(false);
        return;
      }

      const snapshot = await getDocs(ticketsQuery);
      const allTickets = snapshot.docs.map(doc => ({
        id: doc.id,
        docRef: doc.ref,
        ...doc.data(),
      } as Ticket));

      setTickets(allTickets);
      groupTicketsByEvent(allTickets);
    } catch (e: any) {
      console.error("Error loading tickets:", e);
      toast.error("Failed to load tickets: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [user, groupTicketsByEvent]);

  // Initialize data only once when user is available
  if (!authLoading && user && !initialized) {
    setInitialized(true);
    loadTickets();
  }

  const filteredEventGroups = eventGroups.filter(group => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      group.eventName.toLowerCase().includes(searchLower) ||
      group.venue?.toLowerCase().includes(searchLower)
    );
  });

  const filteredTickets = tickets.filter(t => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      t.userId?.toLowerCase().includes(searchLower) ||
      t.eventName?.toLowerCase().includes(searchLower) ||
      t.venue?.toLowerCase().includes(searchLower) ||
      t.ticketNumber?.toLowerCase().includes(searchLower)
    );
  });

  const markUsed = async (ticket: Ticket) => {
    if (ticket.status === 'used') return;
    try {
      if (ticket.docRef) {
        await updateDoc(ticket.docRef, { status: 'used' });
      }
      toast.success("Ticket marked as used!");
      loadTickets();
    } catch (e: any) {
      toast.error("Error updating ticket: " + e.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'used':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Used
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      case 'confirmed':
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Active
          </Badge>
        );
    }
  };

  const usedCount = tickets.filter(t => t.status === 'used').length;
  const totalRevenue = tickets.reduce((sum, t) => sum + (t.totalPrice || t.pricePerTicket || 0), 0);

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
            You don't have permission to view tickets.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Ticket Management
            {user.role !== "siteAdmin" && (
              <span className="text-lg text-muted-foreground font-normal ml-2">
                - Your Venue
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">
            {user.role === "siteAdmin" 
              ? "Track and manage all event tickets across all venues"
              : "Track and manage tickets for your venue events"
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadTickets} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Compact Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TicketIcon className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Tickets</p>
              <p className="text-lg font-bold">{tickets.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Used</p>
              <p className="text-lg font-bold">{usedCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 text-green-600 font-bold">£</div>
            <div>
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-lg font-bold">£{totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Events</p>
              <p className="text-lg font-bold">{eventGroups.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Compact Search and View Controls */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events, venues, users..."
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'events' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('events')}
          >
            Events
          </Button>
          <Button
            variant={viewMode === 'tickets' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('tickets')}
          >
            All Tickets
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : viewMode === 'events' ? (
        /* Compact Events Table */
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Events ({filteredEventGroups.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredEventGroups.length === 0 ? (
              <div className="p-8 text-center">
                <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No events found</h3>
                <p className="text-muted-foreground">
                  {search 
                    ? "Try adjusting your search terms" 
                    : user.role === "siteAdmin"
                      ? "No events have tickets yet"
                      : "No events for your venue have tickets yet"
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-center">Tickets</TableHead>
                    <TableHead className="text-center">Used</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-center">Usage %</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEventGroups.map((group) => (
                    <TableRow key={group.eventName}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {group.eventName}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{group.venue}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {group.totalCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {group.usedCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        £{group.totalRevenue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={group.usedCount / group.totalCount > 0.7 ? "default" : "secondary"}>
                          {group.totalCount > 0 ? Math.round((group.usedCount / group.totalCount) * 100) : 0}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <EventDetailsModal 
                            eventGroup={group} 
                            onMarkUsed={markUsed}
                          />
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Compact All Tickets Table */
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">All Tickets ({filteredTickets.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center">
                <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No tickets found</h3>
                <p className="text-muted-foreground">
                  {search 
                    ? "Try adjusting your search terms" 
                    : user.role === "siteAdmin"
                      ? "No tickets have been purchased yet"
                      : "No tickets have been purchased for your venue yet"
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium max-w-[150px] truncate">
                        {ticket.eventName}
                      </TableCell>
                      <TableCell className="font-mono text-sm max-w-[120px] truncate">
                        {ticket.userId}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {ticket.ticketNumber || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateSafe(ticket.purchaseDate)}
                      </TableCell>
                      <TableCell>
                        £{(ticket.totalPrice || ticket.pricePerTicket || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(ticket.status)}
                      </TableCell>
                      <TableCell>
                        {ticket.status === 'used' || ticket.status === 'cancelled' ? (
                          <Button variant="ghost" size="sm" disabled>
                            {ticket.status === 'used' ? 'Used' : 'Cancelled'}
                          </Button>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Mark Used
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Mark Ticket as Used</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to mark this ticket as used? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => markUsed(ticket)}>
                                  Mark as Used
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function TicketsPage() {
  return (
    <RequireAuth>
      <TicketsPageContent />
    </RequireAuth>
  );
}