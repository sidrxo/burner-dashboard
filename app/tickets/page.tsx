"use client";
import { useEffect, useState } from "react";
import { collectionGroup, getDocs, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
import { Ticket as TicketIcon, RefreshCw, Search, CheckCircle, Clock } from "lucide-react";

type Ticket = {
  id: string;
  userID: string;
  userEmail: string;
  eventName: string;
  ticketPrice: number;
  purchaseDate: any;
  isUsed: boolean;
  usedAt?: any;
  docRef?: any;
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collectionGroup(db, "tickets"));
      const allTickets = snap.docs.map(doc => ({
        id: doc.id,
        docRef: doc.ref,
        ...doc.data(),
      } as Ticket));
      setTickets(allTickets);
    } catch (e: any) {
      toast.error("Failed to load tickets: " + e.message);
    } finally {
      setLoading(false);
    }
  };

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

  const usedCount = tickets.filter(t => t.isUsed).length;
  const totalRevenue = tickets.reduce((sum, t) => sum + t.ticketPrice, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ticket Management</h1>
          <p className="text-muted-foreground">Track and manage all event tickets</p>
        </div>
        <Button onClick={loadTickets} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold">{tickets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Used Tickets</p>
                <p className="text-2xl font-bold">{usedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 text-green-600">£</div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">£{totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by event, user, or ID..."
          className="pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Tickets ({filteredTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 text-center">
              <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tickets found</h3>
              <p className="text-muted-foreground">
                {search ? "Try adjusting your search terms" : "No tickets have been purchased yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
{filteredTickets.map((ticket, index) => (
  <TableRow key={`ticket-${ticket.id}-${index}`}>
                    <TableCell className="font-medium">
                      {ticket.eventName}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{ticket.userEmail}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {ticket.userID}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDateSafe(ticket.purchaseDate)}
                    </TableCell>
                    <TableCell>
                      £{ticket.ticketPrice.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={ticket.isUsed ? "default" : "secondary"}
                        className="gap-1"
                      >
                        {ticket.isUsed ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Used
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            Active
                          </>
                        )}
                      </Badge>
                      {ticket.isUsed && ticket.usedAt && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDateSafe(ticket.usedAt)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {ticket.isUsed ? (
                        <Button variant="ghost" size="sm" disabled>
                          Used
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
    </div>
  );
}