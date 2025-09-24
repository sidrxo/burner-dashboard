"use client";

import RequireAuth from "@/components/require-auth";
import { useVenuesData } from "@/hooks/useVenuesData";
import {
  AccessDenied,
  VenuesHeader,
  CreateVenueForm,
  EmptyVenuesState,
  VenueGridCard
} from "@/components/venues/VenuesComponents";

function VenuesPageContent() {
  const {
    user,
    loading,
    venues,
    actionLoading,
    newVenueName,
    setNewVenueName,
    newVenueAdminEmail,
    setNewVenueAdminEmail,
    showCreateVenueDialog,
    setShowCreateVenueDialog,
    handleCreateVenueWithAdmin,
    handleRemoveVenue,
    resetCreateForm
  } = useVenuesData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <VenuesHeader 
        user={user}
        showCreateVenueDialog={showCreateVenueDialog}
        setShowCreateVenueDialog={setShowCreateVenueDialog}
      />

      {user.role === "siteAdmin" && (
        <CreateVenueForm
          showCreateVenueDialog={showCreateVenueDialog}
          setShowCreateVenueDialog={setShowCreateVenueDialog}
          newVenueName={newVenueName}
          setNewVenueName={setNewVenueName}
          newVenueAdminEmail={newVenueAdminEmail}
          setNewVenueAdminEmail={setNewVenueAdminEmail}
          actionLoading={actionLoading}
          handleCreateVenueWithAdmin={handleCreateVenueWithAdmin}
          resetCreateForm={resetCreateForm}
        />
      )}

      {venues.length === 0 ? (
        <EmptyVenuesState 
          user={user}
          setShowCreateVenueDialog={setShowCreateVenueDialog}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {venues.map((venue) => (
            <VenueGridCard
              key={venue.id}
              venue={venue}
              user={user}
              actionLoading={actionLoading}
              handleRemoveVenue={handleRemoveVenue}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VenuesPage() {
  return (
    <RequireAuth>
      <VenuesPageContent />
    </RequireAuth>
  );
}