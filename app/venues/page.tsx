"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDocs, updateDoc, setDoc } from "firebase/firestore";
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

type Venue = {
  id: string;
  name: string;
  admins: string[];    // venueAdmins
  subAdmins: string[]; // subAdmins
};

export default function VenuesPage() {
  const { user, loading } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

      // Filter venues for venueAdmins
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

  const handleAddAdmin = async () => {
    if (!newAdminEmail || !selectedVenueId) return;
    setActionLoading(true);

    try {
      // Lookup user by email
      const usersSnapshot = await getDocs(collection(db, "users"));
      let userDocId: string | null = null;
      usersSnapshot.forEach((doc) => {
        if (doc.data().email === newAdminEmail) userDocId = doc.id;
      });

      // If user exists, update role
      if (userDocId) {
        const userRef = doc(db, "users", userDocId);
        const newRole =
          user && user.role === "siteAdmin" ? "venueAdmin" : "subAdmin";
        await updateDoc(userRef, { role: newRole, venueId: selectedVenueId });
      } else {
        // If user does not exist, create new doc
        const newUserRef = doc(db, "users", newAdminEmail); // using email as doc ID for simplicity
        const newRole =
          user && user.role === "siteAdmin" ? "venueAdmin" : "subAdmin";
        await setDoc(newUserRef, {
          email: newAdminEmail,
          role: newRole,
          venueId: selectedVenueId,
        });
      }

      // Update venue doc
      const venueRef = doc(db, "venues", selectedVenueId);
      const venue = venues.find((v) => v.id === selectedVenueId);
      if (!venue) throw new Error("Venue not found");
      const arrayField = user && user.role === "siteAdmin" ? "admins" : "subAdmins";
      await updateDoc(venueRef, {
        [arrayField]: [...(venue[arrayField] || []), newAdminEmail],
      });

      toast.success("Admin added successfully");
      setNewAdminEmail("");
      fetchVenues();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add admin");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {venues.map((venue) => (
        <Card key={venue.id}>
          <CardHeader>
            <CardTitle>{venue.name}</CardTitle>
            <CardDescription>
              {user && user.role === "siteAdmin"
                ? `VenueAdmins: ${venue.admins.join(", ")}`
                : `SubAdmins: ${venue.subAdmins.join(", ")}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex gap-2 items-center">
              <Label htmlFor="newAdminEmail">
                Add {user && user.role === "siteAdmin" ? "VenueAdmin" : "SubAdmin"}
              </Label>
              <Input
                id="newAdminEmail"
                placeholder="admin@example.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
              <Button
                onClick={() => {
                  setSelectedVenueId(venue.id);
                  handleAddAdmin();
                }}
                disabled={actionLoading}
              >
                {actionLoading ? "Adding..." : "Add"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
