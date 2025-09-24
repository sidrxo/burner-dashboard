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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatDateSafe } from "@/lib/utils";
import { 
  Ticket as TicketIcon, 
  RefreshCw, 
  Search, 
  CheckCircle, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  Users,
  Calendar,
  TrendingUp
} from "lucide-react";
import { Ticket, EventGroup, TicketsStats } from "@/hooks/useTicketsData";

export function AccessDenied() {
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

export function TicketsHeader({ 
  user, 
  loading, 
  loadTickets 
}: { 
  user: any; 
  loading: boolean; 
  loadTickets: () => void; 
}) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
      <div className="flex gap-2">
        <Button onClick={loadTickets} disabled={loading} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
}

export function StatsCards({ stats }: { stats: TicketsStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
              <p className="text-2xl font-bold">{stats.totalTickets}</p>
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
              <p className="text-2xl font-bold">{stats.usedTickets}</p>
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
              <p className="text-2xl font-bold">£{stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Active Events</p>
              <p className="text-2xl font-bold">{stats.activeEvents}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SearchAndViewControls({ 
  search, 
  setSearch, 
  viewMode, 
  setViewMode 
}: {
  search: string;
  setSearch: (search: string) => void;
  viewMode: 'grouped' | 'list';
  setViewMode: (mode: 'grouped' | 'list') => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      <div className="relative max-w-md w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by event, user, or ID..."
          className="pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      
      <div className="flex gap-1 border rounded-md p-1">
        <Button
          variant={viewMode === 'grouped' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('grouped')}
        >
          By Event
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          All Tickets
        </Button>
      </div>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export function EmptyTicketsState({ 
  search, 
  userRole 
}: {
  search: string;
  userRole: string;
}) {
  return (
    <Card className="p-8 text-center">
      <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No tickets found</h3>
      <p className="text-muted-foreground">
        {search 
          ? "Try adjusting your search terms" 
          : userRole === "siteAdmin"
            ? "No tickets have been purchased yet"
            : "No tickets have been purchased for your venue yet"
        }
      </p>
    </Card>
  );
}

export function GroupedTicketsView({ 
  filteredEventGroups, 
  expandedEvents, 
  toggleEventExpansion, 
  markUsed, 
  search, 
  userRole 
}: {
  filteredEventGroups: EventGroup[];
  expandedEvents: Set<string>;
  toggleEventExpansion: (eventName: string) => void;
  markUsed: (ticket: Ticket) => void;
  search: string;
  userRole: string;
}) {
  if (filteredEventGroups.length === 0) {
    return <EmptyTicketsState search={search} userRole={userRole} />;
  }

  return (
    <div className="space-y-4">
      {filteredEventGroups.map((group) => (
        <Card key={group.eventName} className="overflow-hidden">
          <Collapsible
            open={expandedEvents.has(group.eventName)}
            onOpenChange={() => toggleEventExpansion(group.eventName)}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedEvents.has(group.eventName) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{group.eventName}</CardTitle>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{group.totalCount} tickets</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{group.usedCount} used</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium">£{group.totalRevenue.toFixed(2)}</span>
                    </div>
                    <Badge variant="secondary">
                      {Math.round((group.usedCount / group.totalCount) * 100)}% used
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <Separator />
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.tickets.map((ticket, index) => (
                      <TableRow key={`${group.eventName}-ticket-${ticket.id}-${index}`}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{ticket.userEmail}</div>
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
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}

export function ListTicketsView({ 
  filteredTickets, 
  markUsed, 
  search, 
  userRole 
}: {
  filteredTickets: Ticket[];
  markUsed: (ticket: Ticket) => void;
  search: string;
  userRole: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          All Tickets ({filteredTickets.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {filteredTickets.length === 0 ? (
          <EmptyTicketsState search={search} userRole={userRole} />
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
                <TableRow key={`all-tickets-${ticket.id}-${index}`}>
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
  );
}