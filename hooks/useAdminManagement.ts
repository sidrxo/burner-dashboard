"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/useAuth";
import { 
  collection, 
  getDocs, 
  query,
  orderBy 
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
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
  needsPasswordReset?: boolean;
}

export interface Venue {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  admins: string[];
  subAdmins: string[];
}

export interface CreateAdminData {
  email: string;
  name: string;
  role: 'venueAdmin' | 'subAdmin' | 'siteAdmin';
  venueId?: string;
}

export function useAdminManagement() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && user.role === "siteAdmin") {
      loadData();
    } else if (!authLoading && user && user.role !== "siteAdmin") {
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load venues (can be done client-side as they're public)
      const venuesSnap = await getDocs(
        query(collection(db, "venues"), orderBy("name"))
      );
      const venuesData = venuesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Venue));
      setVenues(venuesData);

      // Load admins (can be done client-side with proper security rules)
      const adminsSnap = await getDocs(
        query(collection(db, "admins"), orderBy("createdAt", "desc"))
      );
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
      setLoading(true);
      
      // Call Cloud Function to create admin securely
      const createAdminFunction = httpsCallable(functions, 'createAdmin');
      const result = await createAdminFunction({
        email: adminData.email.trim(),
        name: adminData.name.trim(),
        role: adminData.role,
        venueId: adminData.venueId || null
      });

      const response = result.data as any;
      
      if (response.success) {
        toast.success(response.message);
        
        // Refresh user to get updated permissions if needed
        await refreshUser();
        
        // Reload admin data
        await loadData();
        
        return { success: true };
      } else {
        throw new Error(response.message || "Failed to create admin");
      }
    } catch (error: any) {
      console.error("Error creating admin:", error);
      
      let errorMessage = "Failed to create admin";
      
      if (error.code === 'functions/permission-denied') {
        errorMessage = "You don't have permission to create admins";
      } else if (error.code === 'functions/invalid-argument') {
        errorMessage = error.message || "Invalid data provided";
      } else if (error.code === 'functions/already-exists') {
        errorMessage = "Admin with this email already exists";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateAdmin = async (adminId: string, updates: Partial<Admin>) => {
    try {
      setLoading(true);
      
      // Call Cloud Function to update admin securely
      const updateAdminFunction = httpsCallable(functions, 'updateAdmin');
      const result = await updateAdminFunction({
        adminId: adminId,
        updates: {
          ...(updates.role && { role: updates.role }),
          ...(typeof updates.active === 'boolean' && { active: updates.active }),
          ...(updates.venueId !== undefined && { venueId: updates.venueId }),
          ...(updates.name && { name: updates.name }),
          ...(updates.email && { email: updates.email })
        }
      });

      const response = result.data as any;
      
      if (response.success) {
        toast.success(response.message);
        
        // Refresh user permissions
        await refreshUser();
        
        // Reload data
        await loadData();
      } else {
        throw new Error(response.message || "Failed to update admin");
      }
    } catch (error: any) {
      console.error("Error updating admin:", error);
      
      let errorMessage = "Failed to update admin";
      
      if (error.code === 'functions/permission-denied') {
        errorMessage = "You don't have permission to update this admin";
      } else if (error.code === 'functions/not-found') {
        errorMessage = "Admin not found";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteAdmin = async (adminId: string) => {
    try {
      setLoading(true);
      
      // Call Cloud Function to delete admin securely
      const deleteAdminFunction = httpsCallable(functions, 'deleteAdmin');
      const result = await deleteAdminFunction({
        adminId: adminId
      });

      const response = result.data as any;
      
      if (response.success) {
        toast.success(response.message);
        
        // Refresh user permissions
        await refreshUser();
        
        // Reload data
        await loadData();
      } else {
        throw new Error(response.message || "Failed to delete admin");
      }
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      
      let errorMessage = "Failed to delete admin";
      
      if (error.code === 'functions/permission-denied') {
        errorMessage = "You don't have permission to delete this admin";
      } else if (error.code === 'functions/not-found') {
        errorMessage = "Admin not found";
      } else if (error.code === 'functions/failed-precondition') {
        errorMessage = "Cannot delete your own admin account";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createVenue = async (name: string, adminEmail: string) => {
    try {
      setLoading(true);
      
      // Call Cloud Function to create venue securely
      const createVenueFunction = httpsCallable(functions, 'createVenue');
      const result = await createVenueFunction({
        name: name.trim(),
        adminEmail: adminEmail.trim()
      });

      const response = result.data as any;
      
      if (response.success) {
        toast.success(response.message);
        
        // Reload data
        await loadData();
        
        return { success: true, venueId: response.venueId };
      } else {
        throw new Error(response.message || "Failed to create venue");
      }
    } catch (error: any) {
      console.error("Error creating venue:", error);
      
      let errorMessage = "Failed to create venue";
      
      if (error.code === 'functions/permission-denied') {
        errorMessage = "You don't have permission to create venues";
      } else if (error.code === 'functions/invalid-argument') {
        errorMessage = error.message || "Invalid data provided";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
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
    createVenue,
    loadData,
    refreshUser
  };
}