"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDocs, updateDoc, setDoc, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/useAuth";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Settings,
  MoreVertical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Venue = {
  id: string;
  name: string;
  admins: string[];
  subAdmins: string[];
};

export default function VenuesPage() {
  const { user, loading } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueAdminEmail, setNewVenueAdminEmail] = useState("");
  const [showCreateVenueDialog, setShowCreateVenueDialog] = useState(false);
  const [manageVenueDialog, setManageVenueDialog] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      fetchVenues();
    }
  }, [user, loading]);

  const fetchVenues = async () => {
    try {
      const snapshot = await getDocs(collection(db, "venues"));
      const fetched: Venue[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetched.push({
          id: doc.id,
          name: data.name,
          admins: data.admins || [],
          subAdmins: data.subAdmins || [],
        });
      });

      if (user && user.role === "venueAdmin") {
        setVenues(fetched.filter((v) => v.id === user.venueId));
      } else {
        setVenues(fetched);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch venues");
    }
  };

  const handleCreateVenueWithAdmin = async () => {
    if (!newVenueName.trim() || !newVenueAdminEmail.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newVenueAdminEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setActionLoading(true);
    try {
      const venueRef = await addDoc(collection(db, "venues"), {
        name: newVenueName.trim(),
        admins: [newVenueAdminEmail.trim()],
        subAdmins: [],
      });

      const usersSnapshot = await getDocs(collection(db, "users"));
      let userDocId: string | null = null;
      usersSnapshot.forEach((doc) => {
        if (doc.data().email === newVenueAdminEmail.trim()) {
          userDocId = doc.id;
        }
      });

      if (userDocId) {
        const userRef = doc(db, "users", userDocId);
        await updateDoc(userRef, { 
          role: "venueAdmin", 
          venueId: venueRef.id 
        });
      } else {
        const newUserRef = doc(db, "users", newVenueAdminEmail.trim());
        await setDoc(newUserRef, { 
          email: newVenueAdminEmail.trim(), 
          role: "venueAdmin", 
          venueId: venueRef.id 
        });
      }

      toast.success(`Venue "${newVenueName}" created successfully`);
      setNewVenueName("");
      setNewVenueAdminEmail("");
      setShowCreateVenueDialog(false);
      fetchVenues();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create venue");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveVenue = async (venueId: string, venueName: string) => {
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "venues", venueId));
      
      const usersSnapshot = await getDocs(collection(db, "users"));
      const updatePromises: Promise<void>[] = [];
      usersSnapshot.forEach((docSnap) => {
        if (docSnap.data().venueId === venueId) {
          const userRef = doc(db, "users", docSnap.id);
          updatePromises.push(updateDoc(userRef, { role: "user", venueId: null }));
        }
      });
      await Promise.all(updatePromises);

      toast.success(`Venue "${venueName}" removed successfully`);
      fetchVenues();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove venue");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddAdmin = async (venueId: string) => {
    if (!newAdminEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setActionLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      let userDocId: string | null = null;
      usersSnapshot.forEach((doc) => {
        if (doc.data().email === newAdminEmail.trim()) userDocId = doc.id;
      });

      if (!user) throw new Error("User not found");

      if (userDocId) {
        const userRef = doc(db, "users", userDocId);
        const newRole = user.role === "siteAdmin" ? "venueAdmin" : "subAdmin";
        await updateDoc(userRef, { role: newRole, venueId: venueId });
      } else {
        const newUserRef = doc(db, "users", newAdminEmail.trim());
        const newRole = user.role === "siteAdmin" ? "venueAdmin" : "subAdmin";
        await setDoc(newUserRef, { 
          email: newAdminEmail.trim(), 
          role: newRole, 
          venueId: venueId 
        });
      }

      const venueRef = doc(db, "venues", venueId);
      const venue = venues.find((v) => v.id === venueId);
      if (!venue) throw new Error("Venue not found");
      
      const arrayField = user.role === "siteAdmin" ? "admins" : "subAdmins";
      await updateDoc(venueRef, { 
        [arrayField]: [...(venue[arrayField] || []), newAdminEmail.trim()] 
      });

      const roleType = user.role === "siteAdmin" ? "venue admin" : "sub-admin";
      toast.success(`${roleType} added successfully`);
      setNewAdminEmail("");
      fetchVenues();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add admin");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAdmin = async (venueId: string, email: string, isVenueAdmin: boolean) => {
    setActionLoading(true);
    try {
      const venueRef = doc(db, "venues", venueId);
      const venue = venues.find((v) => v.id === venueId);
      if (!venue) throw new Error("Venue not found");
      
      const arrayField = isVenueAdmin ? "admins" : "subAdmins";
      const updatedArray = venue[arrayField].filter((e) => e !== email);
      await updateDoc(venueRef, { [arrayField]: updatedArray });

      const usersSnapshot = await getDocs(collection(db, "users"));
      const updatePromises: Promise<void>[] = [];
      usersSnapshot.forEach((docSnap) => {
        if (docSnap.data().email === email) {
          const userRef = doc(db, "users", docSnap.id);
          updatePromises.push(updateDoc(userRef, { role: "user", venueId: null }));
        }
      });
      await Promise.all(updatePromises);

      const roleType = isVenueAdmin ? "venue admin" : "sub-admin";
      toast.success(`${roleType} removed successfully`);
      fetchVenues();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove admin");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
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

  const ManageVenueDialog = ({ venue }: { venue: Venue }) => (
    <Dialog open={manageVenueDialog === venue.id} onOpenChange={(open) => setManageVenueDialog(open ? venue.id : null)}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Manage {venue.name}
          </DialogTitle>
          <DialogDescription>
            Add or remove administrators for this venue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Admin Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Add {user.role === "siteAdmin" ? "Venue Admin" : "Sub-Admin"}
            </Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => handleAddAdmin(venue.id)}
                disabled={actionLoading || !newAdminEmail.trim()}
                className="gap-2"
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

          {/* Venue Admins */}
          {user.role === "siteAdmin" && venue.admins.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                Venue Administrators ({venue.admins.length})
              </Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {venue.admins.map((email) => (
                  <div key={email} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium">{email}</span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Venue Administrator</AlertDialogTitle>
                          <AlertDialogDescription>
                            Remove {email} as a venue administrator?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveAdmin(venue.id, email, true)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Admins */}
          {venue.subAdmins.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                Sub-Administrators ({venue.subAdmins.length})
              </Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {venue.subAdmins.map((email) => (
                  <div key={email} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">{email}</span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Sub-Administrator</AlertDialogTitle>
                          <AlertDialogDescription>
                            Remove {email} as a sub-administrator?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveAdmin(venue.id, email, false)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Venues Management</h1>
            <p className="text-muted-foreground">
              {venues.length} venue{venues.length !== 1 ? 's' : ''} • Manage venues and their administrative staff
            </p>
          </div>
        </div>

        {user.role === "siteAdmin" && (
          <Dialog open={showCreateVenueDialog} onOpenChange={setShowCreateVenueDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Venue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Create New Venue
                </DialogTitle>
                <DialogDescription>
                  Create a new venue and assign its first administrator
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
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
                  <Label htmlFor="admin-email">Administrator Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={newVenueAdminEmail}
                    onChange={(e) => setNewVenueAdminEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleCreateVenueWithAdmin}
                  disabled={actionLoading || !newVenueName.trim() || !newVenueAdminEmail.trim()}
                  className="w-full gap-2"
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
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Venues Grid */}
      {venues.length === 0 ? (
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {venues.map((venue) => (
            <Card key={venue.id} className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg truncate" title={venue.name}>
                        {venue.name}
                      </CardTitle>
                    </div>
                  </div>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-2" align="end">
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={() => setManageVenueDialog(venue.id)}
                        >
                          <Settings className="h-4 w-4" />
                          Manage
                        </Button>
                        {user.role === "siteAdmin" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2 text-destructive hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
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
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Crown className="h-3 w-3 text-amber-500" />
                      <span>{venue.admins.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-blue-500" />
                      <span>{venue.subAdmins.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{venue.admins.length + venue.subAdmins.length} total</span>
                    </div>
                  </div>

                  {/* Quick Admin Preview */}
                  <div className="space-y-2">
                    {venue.admins.slice(0, 2).map((email) => (
                      <div key={email} className="flex items-center gap-2 text-xs">
                        <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                        <span className="truncate text-muted-foreground" title={email}>
                          {email}
                        </span>
                      </div>
                    ))}
                    {venue.subAdmins.slice(0, 2).map((email) => (
                      <div key={email} className="flex items-center gap-2 text-xs">
                        <Shield className="h-3 w-3 text-blue-500 shrink-0" />
                        <span className="truncate text-muted-foreground" title={email}>
                          {email}
                        </span>
                      </div>
                    ))}
                    {venue.admins.length + venue.subAdmins.length > 4 && (
                      <div className="text-xs text-muted-foreground">
                        +{venue.admins.length + venue.subAdmins.length - 4} more
                      </div>
                    )}
                    {venue.admins.length === 0 && venue.subAdmins.length === 0 && (
                      <div className="text-xs text-muted-foreground italic">
                        No administrators assigned
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 mt-3"
                    onClick={() => setManageVenueDialog(venue.id)}
                  >
                    <Settings className="h-4 w-4" />
                    Manage Venue
                  </Button>
                </div>
              </CardContent>

              <ManageVenueDialog venue={venue} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}