"use client";

import RequireAuth from "@/components/require-auth";
import { useOverviewData } from "@/hooks/useOverviewData";
import {
  LoadingSkeleton,
  AccessDenied,
  MetricsCards,
  SalesChart,
  EventPerformanceTable,
  TicketUsageProgress
} from "@/components/overview/OverviewComponents";

function OverviewPageContent() {
  const {
    user,
    authLoading,
    loading,
    eventStats,
    dailySales,
    metrics
  } = useOverviewData();

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
    return <AccessDenied />;
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Overview</h1>

      <MetricsCards metrics={metrics} userRole={user.role} />

      <SalesChart dailySales={dailySales} userRole={user.role} />

      <EventPerformanceTable eventStats={eventStats} userRole={user.role} />

      <TicketUsageProgress metrics={metrics} userRole={user.role} />
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