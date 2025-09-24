"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/useAuth";
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc,
  query,
  where 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'venueAdmin' | 'subAdmin' | 'siteAdmin';
  venueId?: string;
  createdAt: Date;
  lastLogin?: Date;
  active: boolean;
  tempPassword?: boolean;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
}

export interface CreateAdminData {
  email: string;
  name: string;
  role: 'venueAdmin' | 'subAdmin' | 'siteAdmin';
  venueId?: string;
}

export function useAdminManagement() {
  const { user, loading: authLoading } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && user.role === "siteAdmin") {
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load venues
      const venuesSnap = await getDocs(collection(db, "venues"));
      const venuesData = venuesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Venue));
      setVenues(venuesData);

      // Load admins from the /admins/ collection
      const adminsSnap = await getDocs(collection(db, "admins"));
      const adminsData = adminsSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastLogin: doc.data().lastLogin?.toDate()
        } as Admin));
      
      setAdmins(adminsData);
    } catch (error) {
      console.error("Error loading admin management data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async (adminData: CreateAdminData) => {
    try {
      // Create admin document in Firestore /admins/ collection
      const adminDoc = {
        email: adminData.email,
        name: adminData.name,
        role: adminData.role,
        venueId: adminData.venueId || null,
        createdAt: new Date(),
        active: true,
        tempPassword: true // Flag to indicate they need to set up their account
      };

      await addDoc(collection(db, "admins"), adminDoc);

      toast.success(`Admin created successfully! They will need to sign up with the email: ${adminData.email}`);
      
      // Reload data
      await loadData();
      
      return { success: true };
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast.error(`Failed to create admin: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  const deleteAdmin = async (adminId: string) => {
    try {
      await deleteDoc(doc(db, "admins", adminId));
      toast.success("Admin deleted successfully");
      await loadData();
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast.error("Failed to delete admin");
    }
  };

  const updateAdmin = async (adminId: string, updates: Partial<Admin>) => {
    try {
      // Remove id from updates to avoid Firestore error
      const { id, createdAt, ...cleanUpdates } = updates;
      
      await updateDoc(doc(db, "admins", adminId), cleanUpdates);
      toast.success("Admin updated successfully");
      await loadData();
    } catch (error) {
      console.error("Error updating admin:", error);
      toast.error("Failed to update admin");
    }
  };

  return {
    user,
    authLoading,
    loading,
    admins,
    venues,
    createAdmin,
    deleteAdmin,
    updateAdmin,
    loadData
  };
}