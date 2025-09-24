"use client";

import RequireAuth from "@/components/require-auth";
import { useState } from "react";
import { useEventsData, Event } from "@/hooks/useEventsData";
import {
  EventSkeleton,
  AccessDenied,
  CreateEventDialog,
  SearchAndStats,
  EmptyEventsState,
  EventCard
} from "@/components/events/EventsComponents";

function EventsPageContent() {
  const {
    user,
    authLoading,
    events,
    venues,
    loading,
    search,
    setSearch,
    filtered,
    onToggleFeatured,
    onDelete,
    getEventStatus,
    getTicketProgress,
    setEvents
  } = useEventsData();

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show access denied for users without proper permissions
  if (!user) {
    return <AccessDenied user={null} />;
  }

  if (user.role !== "siteAdmin" && user.role !== "venueAdmin" && user.role !== "subAdmin") {
    return <AccessDenied user={user} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <CreateEventDialog
          openForm={openForm}
          setOpenForm={setOpenForm}
          editing={editing}
          setEditing={setEditing}
          user={user}
          venues={venues}
          setEvents={setEvents}
        />
      </div>

      <SearchAndStats 
        search={search}
        setSearch={setSearch}
        events={events}
      />

      {/* Events Grid */}
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({length: 6}).map((_, i) => <EventSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <EmptyEventsState 
            search={search}
            setOpenForm={setOpenForm}
            userRole={user.role}
          />
        ) : (
          filtered.map((ev, index) => {
            const eventStatus = getEventStatus(ev);
            const ticketProgress = getTicketProgress(ev);
            
            return (
              <EventCard
                key={`event-${ev.id}-${index}`}
                ev={ev}
                index={index}
                eventStatus={eventStatus}
                ticketProgress={ticketProgress}
                user={user}
                onToggleFeatured={onToggleFeatured}
                onDelete={onDelete}
                setEditing={setEditing}
                setOpenForm={setOpenForm}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <RequireAuth>
      <EventsPageContent />
    </RequireAuth>
  );
}