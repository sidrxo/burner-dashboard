import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Building2,
  Plus,
  Trash2,
  UserPlus,
  UserMinus,
  Mail,
  Crown,
  Shield,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Venue } from "@/hooks/useVenuesData";

export function AccessDenied() {
  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle className="text-center">Access Denied</CardTitle>
        <CardDescription className="text-center">
          Please log in to manage venues
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export function VenuesHeader({ 
  user, 
  showCreateVenueDialog, 
  setShowCreateVenueDialog 
}: { 
  user: any;
  showCreateVenueDialog: boolean;
  setShowCreateVenueDialog: (show: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">Venues</h1>
      {user.role === "siteAdmin" && (
        <Button 
          onClick={() => setShowCreateVenueDialog(true)} 
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Venue
        </Button>
      )}
    </div>
  );
}

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
}: {
  showCreateVenueDialog: boolean;
  setShowCreateVenueDialog: (show: boolean) => void;
  newVenueName: string;
  setNewVenueName: (name: string) => void;
  newVenueAdminEmail: string;
  setNewVenueAdminEmail: (email: string) => void;
  actionLoading: boolean;
  handleCreateVenueWithAdmin: () => void;
  resetCreateForm: () => void;
}) {
  if (!showCreateVenueDialog) return null;

  return (
    <Card className="p-4 border-2 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create New Venue
          </h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setShowCreateVenueDialog(false);
              resetCreateForm();
            }}
          >
            Cancel
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Create a new venue and assign its first venue administrator
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="venue-name">Venue Name</Label>
            <Input
              id="venue-name"
              placeholder="Enter venue name"
              value={newVenueName}
              onChange={(e) => setNewVenueName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-email">Venue Administrator Email</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@example.com"
              value={newVenueAdminEmail}
              onChange={(e) => setNewVenueAdminEmail(e.target.value)}
            />
          </div>
        </div>
        <Button 
          onClick={handleCreateVenueWithAdmin}
          disabled={actionLoading || !newVenueName.trim() || !newVenueAdminEmail.trim()}
          className="gap-2 w-full md:w-auto"
        >
          {actionLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Create Venue
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

export function EmptyVenuesState({ 
  user, 
  setShowCreateVenueDialog 
}: { 
  user: any;
  setShowCreateVenueDialog: (show: boolean) => void;
}) {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <CardTitle className="mb-2">No venues found</CardTitle>
        <CardDescription className="mb-4">
          {user.role === "siteAdmin" 
            ? "Create your first venue to get started" 
            : "No venues are assigned to you"}
        </CardDescription>
        {user.role === "siteAdmin" && (
          <Button onClick={() => setShowCreateVenueDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create First Venue
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function VenueCard({ 
  venue, 
  user, 
  newAdminEmail,
  setNewAdminEmail,
  actionLoading,
  handleAddAdmin,
  handleRemoveAdmin,
  handleRemoveVenue
}: {
  venue: Venue;
  user: any;
  newAdminEmail: string;
  setNewAdminEmail: (email: string) => void;
  actionLoading: boolean;
  handleAddAdmin: (venueId: string) => void;
  handleRemoveAdmin: (venueId: string, email: string, isVenueAdmin: boolean) => void;
  handleRemoveVenue: (venueId: string, venueName: string) => void;
}) {
  return (
    <Card key={venue.id} className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{venue.name}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1">
                  <Crown className="h-4 w-4" />
                  {venue.admins.length} Venue Admin{venue.admins.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  {venue.subAdmins.length} Sub-Admin{venue.subAdmins.length !== 1 ? 's' : ''}
                </span>
              </CardDescription>
            </div>
          </div>
          
          {user.role === "siteAdmin" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  disabled={actionLoading}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Venue
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Venue</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{venue.name}"? This will remove all associated admins and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleRemoveVenue(venue.id, venue.name)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete Venue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Add Admin Section */}
        <AddAdminSection 
          user={user}
          venueId={venue.id}
          newAdminEmail={newAdminEmail}
          setNewAdminEmail={setNewAdminEmail}
          actionLoading={actionLoading}
          handleAddAdmin={handleAddAdmin}
        />

        <div className="h-px bg-border"></div>

        {/* Current Admins Section */}
        <AdminsSection 
          venue={venue}
          user={user}
          actionLoading={actionLoading}
          handleRemoveAdmin={handleRemoveAdmin}
        />
      </CardContent>
    </Card>
  );
}

export function AddAdminSection({ 
  user, 
  venueId, 
  newAdminEmail,
  setNewAdminEmail,
  actionLoading,
  handleAddAdmin
}: {
  user: any;
  venueId: string;
  newAdminEmail: string;
  setNewAdminEmail: (email: string) => void;
  actionLoading: boolean;
  handleAddAdmin: (venueId: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-primary" />
        <Label className="text-sm font-medium">
          Add {user.role === "siteAdmin" ? "Venue Admin" : "Sub-Admin"}
        </Label>
      </div>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter email address"
          value={newAdminEmail}
          onChange={(e) => setNewAdminEmail(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={() => handleAddAdmin(venueId)}
          disabled={actionLoading || !newAdminEmail.trim()}
          className="gap-2 min-w-[100px]"
        >
          {actionLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Add
        </Button>
      </div>
    </div>
  );
}

export function AdminsSection({ 
  venue, 
  user, 
  actionLoading, 
  handleRemoveAdmin 
}: {
  venue: Venue;
  user: any;
  actionLoading: boolean;
  handleRemoveAdmin: (venueId: string, email: string, isVenueAdmin: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Venue Administrators */}
      {user.role === "siteAdmin" && venue.admins.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            <Label className="text-sm font-medium">Venue Administrators</Label>
          </div>
          <div className="grid gap-2">
            {venue.admins.map((email) => (
              <AdminCard
                key={email}
                email={email}
                isVenueAdmin={true}
                venue={venue}
                actionLoading={actionLoading}
                handleRemoveAdmin={handleRemoveAdmin}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sub-Administrators */}
      {venue.subAdmins.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            <Label className="text-sm font-medium">Sub-Administrators</Label>
          </div>
          <div className="grid gap-2">
            {venue.subAdmins.map((email) => (
              <AdminCard
                key={email}
                email={email}
                isVenueAdmin={false}
                venue={venue}
                actionLoading={actionLoading}
                handleRemoveAdmin={handleRemoveAdmin}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {venue.admins.length === 0 && venue.subAdmins.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No administrators assigned to this venue</p>
          <p className="text-sm">Add an administrator to get started</p>
        </div>
      )}
    </div>
  );
}

export function AdminCard({ 
  email, 
  isVenueAdmin, 
  venue, 
  actionLoading, 
  handleRemoveAdmin 
}: {
  email: string;
  isVenueAdmin: boolean;
  venue: Venue;
  actionLoading: boolean;
  handleRemoveAdmin: (venueId: string, email: string, isVenueAdmin: boolean) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border ${
        isVenueAdmin 
          ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" 
          : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
      }`}
    >
      <div className="flex items-center gap-3">
        <Mail className={`h-4 w-4 ${isVenueAdmin ? "text-amber-600" : "text-blue-600"}`} />
        <span className="font-medium">{email}</span>
        <Badge 
          variant="secondary" 
          className={isVenueAdmin 
            ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          }
        >
          {isVenueAdmin ? "Venue Admin" : "Sub-Admin"}
        </Badge>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="destructive"
            className="gap-2"
            disabled={actionLoading}
          >
            <UserMinus className="h-4 w-4" />
            Remove
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {isVenueAdmin ? "Venue Administrator" : "Sub-Administrator"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {email} as a {isVenueAdmin ? "venue administrator" : "sub-administrator"}? 
              They will lose their administrative privileges for this venue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleRemoveAdmin(venue.id, email, isVenueAdmin)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}