"use client";
import { useEffect, useState } from "react";
import { collectionGroup, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger 
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatDateSafe } from "@/lib/utils";
import { 
  Users, 
  RefreshCw, 
  Search, 
  Eye, 
  TicketIcon, 
  Mail, 
  User, 
  Shield, 
  ShieldOff,
  Calendar,
  CheckCircle,
  Clock
} from "lucide-react";

type Ticket = {
  id: string;
  userID: string;
  userEmail: string;
  eventName: string;
  ticketPrice: number;
  purchaseDate: any;
  isUsed: boolean;
  usedAt?: any;
};

type UserData = {
  userID: string;
  email: string;
  ticketCount: number;
  totalSpent: number;
  events: string[];
  tickets: Ticket[];
  blocked?: boolean;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collectionGroup(db, "tickets"));
      const userStats: Record<string, UserData> = {};
      
      snapshot.docs.forEach(doc => {
        const ticket = doc.data() as Ticket;
        const userId = ticket.userID;
        
        if (!userStats[userId]) {
          userStats[userId] = {
            userID: userId,
            email: ticket.userEmail || "Unknown",
            ticketCount: 0,
            totalSpent: 0,
            events: [],
            tickets: [],
          };
        }
        
        const user = userStats[userId];
        user.ticketCount++;
        user.totalSpent += ticket.ticketPrice || 0;
        
        if (!user.events.includes(ticket.eventName)) {
          user.events.push(ticket.eventName || "Unknown Event");
        }
        
        user.tickets.push({
          ...ticket,
          id: ticket.id || doc.id,
        });
      });
      
      setUsers(Object.values(userStats));
    } catch (e: any) {
      toast.error("Failed to load users: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.userID.toLowerCase().includes(searchLower)
    );
  });

  const toggleBlockUser = (user: UserData) => {
    const updatedUsers = users.map(u => 
      u.userID === user.userID ? { ...u, blocked: !u.blocked } : u
    );
    setUsers(updatedUsers);
    const action = user.blocked ? "unblocked" : "blocked";
    toast.success(`User ${action} successfully`);
  };

  const totalUsers = users.length;
  const totalRevenue = users.reduce((sum, user) => sum + user.totalSpent, 0);
  const blockedUsers = users.filter(u => u.blocked).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage customers and track their activity</p>
        </div>
        <Button onClick={loadUsers} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Blocked Users</p>
                <p className="text-2xl font-bold">{blockedUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or user ID..."
          className="pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
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
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {search ? "Try adjusting your search terms" : "No users have purchased tickets yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
   {filteredUsers.map((user, index) => (
  <TableRow key={`user-${user.userID}-${index}`}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{user.email}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {user.userID}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {user.ticketCount}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">£{user.totalSpent.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.events.length}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.blocked ? "destructive" : "default"}>
                        {user.blocked ? "Blocked" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <UserDetailsDialog user={selectedUser} />
                        </Dialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              {user.blocked ? (
                                <>
                                  <Shield className="h-3 w-3 mr-1" />
                                  Unblock
                                </>
                              ) : (
                                <>
                                  <ShieldOff className="h-3 w-3 mr-1" />
                                  Block
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {user.blocked ? "Unblock User" : "Block User"}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to {user.blocked ? "unblock" : "block"} {user.email}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => toggleBlockUser(user)}>
                                {user.blocked ? "Unblock" : "Block"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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

function UserDetailsDialog({ user }: { user: UserData | null }) {
  if (!user) return null;

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Details
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4">
        {/* User Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">Email</div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {user.email}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">User ID</div>
            <div className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {user.userID}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Total Spent</div>
            <div className="font-semibold">£{user.totalSpent.toFixed(2)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Status</div>
            <Badge variant={user.blocked ? "destructive" : "default"}>
              {user.blocked ? "Blocked" : "Active"}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Events */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Events Attended ({user.events.length})
          </h4>
          {user.events.length === 0 ? (
            <p className="text-muted-foreground text-sm">No events attended</p>
          ) : (
            <div className="grid gap-2">
           {user.events.map((event, i) => (
  <div key={`event-${i}-${event.slice(0, 10)}`} className="text-sm p-2 bg-muted rounded">

                  {event}
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Tickets */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <TicketIcon className="h-4 w-4" />
            Tickets ({user.ticketCount})
          </h4>
          {user.tickets.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tickets purchased</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
            {user.tickets.map((ticket, i) => (
  <div key={`user-ticket-${ticket.id || i}-${i}`} className="text-sm p-3 border rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{ticket.eventName}</span>
                    <Badge variant={ticket.isUsed ? "default" : "secondary"} className="text-xs">
                      {ticket.isUsed ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Used
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Active
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground space-y-1">
                    <div>Purchased: {formatDateSafe(ticket.purchaseDate)}</div>
                    <div>Price: £{(ticket.ticketPrice || 0).toFixed(2)}</div>
                    {ticket.isUsed && ticket.usedAt && (
                      <div>Used: {formatDateSafe(ticket.usedAt)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DialogContent>
  );
}