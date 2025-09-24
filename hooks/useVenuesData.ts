import { useEffect, useState } from "react";
import { collection, doc, getDocs, updateDoc, setDoc, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/useAuth";
import { toast } from "sonner";

export type Venue = {
  id: string;
  name: string;
  admins: string[];
  subAdmins: string[];
};

export type CreateVenueForm = {
  name: string;
  adminEmail: string;
};

export function useVenuesData() {
  const { user, loading } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueAdminEmail, setNewVenueAdminEmail] = useState("");
  const [showCreateVenueDialog, setShowCreateVenueDialog] = useState(false);

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

  const handleCreateVenueWithAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVenueName.trim() || !newVenueAdminEmail.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newVenueAdminEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setActionLoading(true);
    try {
      // Create the venue first
      const venueRef = await addDoc(collection(db, "venues"), {
        name: newVenueName.trim(),
        admins: [newVenueAdminEmail.trim()],
        subAdmins: [],
      });

      // Check if user already exists
      const usersSnapshot = await getDocs(collection(db, "users"));
      let userDocId: string | null = null;
      usersSnapshot.forEach((doc) => {
        if (doc.data().email === newVenueAdminEmail.trim()) {
          userDocId = doc.id;
        }
      });

      // Create or update user document
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

      toast.success(`Venue "${newVenueName}" created with admin ${newVenueAdminEmail}`);
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

  const handleRemoveVenue = async (venueId: string) => {
    const venue = venues.find(v => v.id === venueId);
    if (!venue) return;
    
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "venues", venueId));
      
      // Reset all users associated with this venue
      const usersSnapshot = await getDocs(collection(db, "users"));
      const updatePromises: Promise<void>[] = [];
      usersSnapshot.forEach((docSnap) => {
        if (docSnap.data().venueId === venueId) {
          const userRef = doc(db, "users", docSnap.id);
          updatePromises.push(updateDoc(userRef, { role: "user", venueId: null }));
        }
      });
      await Promise.all(updatePromises);

      toast.success(`Venue "${venue.name}" and all associated admins removed successfully`);
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setActionLoading(true);
    try {
      // Lookup user by email
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
      // Update venue's admin/subAdmin array
      const venueRef = doc(db, "venues", venueId);
      const venue = venues.find((v) => v.id === venueId);
      if (!venue) throw new Error("Venue not found");
      
      const arrayField = isVenueAdmin ? "admins" : "subAdmins";
      const updatedArray = venue[arrayField].filter((e) => e !== email);
      await updateDoc(venueRef, { [arrayField]: updatedArray });

      // Update user's role in /users
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

  const resetCreateForm = () => {
    setNewVenueName("");
    setNewVenueAdminEmail("");
  };

  return {
    user,
    loading,
    venues,
    newAdminEmail,
    setNewAdminEmail,
    actionLoading,
    newVenueName,
    setNewVenueName,
    newVenueAdminEmail,
    setNewVenueAdminEmail,
    showCreateVenueDialog,
    setShowCreateVenueDialog,
    fetchVenues,
    handleCreateVenueWithAdmin,
    handleRemoveVenue,
    handleAddAdmin,
    handleRemoveAdmin,
    resetCreateForm
  };
}