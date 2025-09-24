"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, MapPin, Users, Settings } from "lucide-react";
import Link from "next/link";

// Type definitions
interface User {
  role: string;
  email?: string | null; // Updated to match AppUser type
}

interface Venue {
  id: string;
  name: string;
  admins?: string[]; // Updated to match the actual data structure from the hook
}

interface VenuesHeaderProps {
  user: User;
  showCreateVenueDialog: boolean;
  setShowCreateVenueDialog: (show: boolean) => void;
}

interface CreateVenueFormProps {
  showCreateVenueDialog: boolean;
  setShowCreateVenueDialog: (show: boolean) => void;
  newVenueName: string;
  setNewVenueName: (name: string) => void;
  newVenueAdminEmail: string;
  setNewVenueAdminEmail: (email: string) => void;
  actionLoading: boolean;
  handleCreateVenueWithAdmin: (e: React.FormEvent) => void;
  resetCreateForm: () => void;
}

interface EmptyVenuesStateProps {
  user: User;
  setShowCreateVenueDialog: (show: boolean) => void;
}

interface VenueCardProps {
  venue: Venue;
  user: User;
  actionLoading: boolean;
  handleRemoveVenue: (venueId: string) => void;
}

// Access Denied Component
export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="text-6xl mb-4">🚫</div>
      <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
      <p className="text-muted-foreground">
        You don't have permission to view this page.
      </p>
    </div>
  );
}

// Venues Header Component
export function VenuesHeader({ user, showCreateVenueDialog, setShowCreateVenueDialog }: VenuesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold">Venues</h1>
        <p className="text-muted-foreground mt-1">
          {user.role === "siteAdmin" 
            ? "Manage all venues in the system" 
            : "Your accessible venues"}
        </p>
      </div>
      
      {user.role === "siteAdmin" && (
        <Button 
          onClick={() => setShowCreateVenueDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Venue
        </Button>
      )}
    </div>
  );
}

// Create Venue Form Component
export function CreateVenueForm({
  showCreateVenueDialog,
  setShowCreateVenueDialog,
  newVenueName,
  setNewVenueName,
  newVenueAdminEmail,
  setNewVenueAdminEmail,
  actionLoading,
  handleCreateVenueWithAdmin,
  resetCreateForm
}: CreateVenueFormProps) {
  return (
    <Dialog open={showCreateVenueDialog} onOpenChange={setShowCreateVenueDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Venue</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateVenueWithAdmin} className="space-y-4">
          <div>
            <Label htmlFor="venue-name">Venue Name</Label>
            <Input
              id="venue-name"
              type="text"
              placeholder="Enter venue name"
              value={newVenueName}
              onChange={(e) => setNewVenueName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="admin-email">Admin Email</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="Enter admin email"
              value={newVenueAdminEmail}
              onChange={(e) => setNewVenueAdminEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateVenueDialog(false);
                resetCreateForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={actionLoading}>
              {actionLoading ? "Creating..." : "Create Venue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Empty Venues State Component
export function EmptyVenuesState({ user, setShowCreateVenueDialog }: EmptyVenuesStateProps) {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <div className="text-6xl mb-4">🏢</div>
        <h3 className="text-xl font-semibold mb-2">No venues found</h3>
        <p className="text-muted-foreground mb-6">
          {user.role === "siteAdmin" 
            ? "Get started by creating your first venue" 
            : "You don't have access to any venues yet"}
        </p>
        {user.role === "siteAdmin" && (
          <Button onClick={() => setShowCreateVenueDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Venue
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// New Grid Card Component for Venues
export function VenueGridCard({ venue, user, actionLoading, handleRemoveVenue }: VenueCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer group">
        <Link href={`/venues/${venue.id}/dashboard`} className="block h-full">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                  {venue.name}
                </CardTitle>
              </div>
              {user.role === "siteAdmin" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{venue.admins?.length || 0} admin(s)</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Settings className="h-4 w-4" />
                <span>View Dashboard</span>
              </div>
              
              {venue.admins && venue.admins.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Primary Admin:</p>
                  <p className="text-sm font-medium truncate">{venue.admins[0]}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Link>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Venue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete "{venue.name}"? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleRemoveVenue(venue.id);
                  setShowDeleteDialog(false);
                }}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Delete Venue"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Keep the original VenueCard component for backward compatibility if needed elsewhere
export function VenueCard({ venue, user, actionLoading, handleRemoveVenue }: VenueCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {venue.name}
          </CardTitle>
          {user.role === "siteAdmin" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleRemoveVenue(venue.id)}
              disabled={actionLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Link 
          href={`/venues/${venue.id}/dashboard`}
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <Settings className="h-4 w-4" />
          View Dashboard
        </Link>
      </CardContent>
    </Card>
  );
}