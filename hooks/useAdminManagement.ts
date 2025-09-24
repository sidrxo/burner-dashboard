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
import { 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut 
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'venueAdmin' | 'subAdmin';
  venueId?: string;
  createdAt: Date;
  lastLogin?: Date;
  active: boolean;
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
  role: 'venueAdmin' | 'subAdmin';
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

      // Load admins (users with venueAdmin or subAdmin roles)
      const usersSnap = await getDocs(collection(db, "users"));
      const adminsData = usersSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastLogin: doc.data().lastLogin?.toDate()
        } as Admin))
        .filter(user => user.role === 'venueAdmin' || user.role === 'subAdmin');
      
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
      // Generate temporary password
      const tempPassword = generateTempPassword();
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        adminData.email, 
        tempPassword
      );
      
      // Create user document in Firestore
      const userDoc = {
        email: adminData.email,
        name: adminData.name,
        role: adminData.role,
        venueId: adminData.venueId || null,
        createdAt: new Date(),
        active: true,
        tempPassword: true // Flag to force password change on first login
      };

      await addDoc(collection(db, "users"), {
        ...userDoc,
        uid: userCredential.user.uid
      });

      // Send password reset email for them to set their own password
      await sendPasswordResetEmail(auth, adminData.email);
      
      // Sign out the newly created user (we don't want to log them in)
      await signOut(auth);

      toast.success(`Admin created successfully! Password reset email sent to ${adminData.email}`);
      
      // Reload data
      await loadData();
      
      return { success: true, tempPassword };
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast.error(`Failed to create admin: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  const deleteAdmin = async (adminId: string) => {
    try {
      await deleteDoc(doc(db, "users", adminId));
      toast.success("Admin deleted successfully");
      await loadData();
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast.error("Failed to delete admin");
    }
  };

  const updateAdmin = async (adminId: string, updates: Partial<Admin>) => {
    try {
      await updateDoc(doc(db, "users", adminId), updates);
      toast.success("Admin updated successfully");
      await loadData();
    } catch (error) {
      console.error("Error updating admin:", error);
      toast.error("Failed to update admin");
    }
  };

  const generateTempPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
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