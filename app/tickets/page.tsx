"use client";

import RequireAuth from "@/components/require-auth";
import { useTicketsData } from "@/hooks/useTicketsData";
import {
  AccessDenied,
  TicketsHeader,
  StatsCards,
  SearchAndViewControls,
  LoadingSkeleton,
  GroupedTicketsView,
  ListTicketsView
} from "@/components/tickets/TicketsComponents";

function TicketsPageContent() {
  const {
    user,
    authLoading,
    loading,
    search,
    setSearch,
    viewMode,
    setViewMode,
    filteredEventGroups,
    filteredTickets,
    expandedEvents,
    toggleEventExpansion,
    markUsed,
    loadTickets,
    stats
  } = useTicketsData();

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <TicketsHeader 
        user={user}
        loading={loading}
        loadTickets={loadTickets}
      />

      <StatsCards stats={stats} />

      <SearchAndViewControls 
        search={search}
        setSearch={setSearch}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : viewMode === 'grouped' ? (
        <GroupedTicketsView 
          filteredEventGroups={filteredEventGroups}
          expandedEvents={expandedEvents}
          toggleEventExpansion={toggleEventExpansion}
          markUsed={markUsed}
          search={search}
          userRole={user.role}
        />
      ) : (
        <ListTicketsView 
          filteredTickets={filteredTickets}
          markUsed={markUsed}
          search={search}
          userRole={user.role}
        />
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