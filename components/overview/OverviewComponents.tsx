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
  CheckCircle,
  XCircle,
  BarChart3
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { OverviewMetrics, EventStats, DailySales } from "@/hooks/useOverviewData";

export function LoadingSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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

export function AccessDenied() {
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

export function MetricsCards({ metrics, userRole }: { 
  metrics: OverviewMetrics; 
  userRole: string; 
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{formatCurrency(metrics.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            Avg per user: {formatCurrency(metrics.avgRevenuePerUser)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
          <Ticket className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalTickets.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.usedTickets} used ({metrics.usageRate.toFixed(1)}%)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {userRole === "siteAdmin" ? "Active customers" : "Your venue customers"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Events</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{0}</div>
          <p className="text-xs text-muted-foreground">
            {userRole === "siteAdmin" ? "Total events created" : "Your venue events"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function SalesChart({ dailySales, userRole }: { 
  dailySales: DailySales[]; 
  userRole: string; 
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Ticket Sales
            </CardTitle>
            <CardDescription>
              {userRole === "siteAdmin" 
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
  );
}

export function EventPerformanceTable({ eventStats, userRole }: { 
  eventStats: EventStats[]; 
  userRole: string; 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Performance</CardTitle>
        <CardDescription>
          {userRole === "siteAdmin" 
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
                <TableHead className="text-right">Tickets Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Usage Rate</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventStats.slice(0, 10).map((event, index) => {
                const eventUsageRate = (event.usedTickets / event.ticketCount) * 100;
                return (
                  <TableRow key={`${event.eventName}-${index}`}>
                    <TableCell className="font-medium">{event.eventName}</TableCell>
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
            {userRole === "siteAdmin" 
              ? "No events found across any venues"
              : "No events found for your venue"
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TicketUsageProgress({ metrics, userRole }: { 
  metrics: OverviewMetrics; 
  userRole: string; 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Ticket Usage Rate
        </CardTitle>
        <CardDescription>
          {userRole === "siteAdmin" 
            ? "Overall ticket utilization across all events"
            : "Ticket utilization for your venue events"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Used Tickets</span>
          <span className="text-sm text-muted-foreground">
            {metrics.usedTickets} / {metrics.totalTickets}
          </span>
        </div>
        <Progress value={metrics.usageRate} className="h-2" />
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Used: {metrics.usedTickets}</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span>Unused: {metrics.totalTickets - metrics.usedTickets}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}