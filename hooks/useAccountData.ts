import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { updatePassword, signOut, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/useAuth";

export type PasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type RoleInfo = {
  title: string;
  variant: "default" | "secondary" | "outline";
  icon: any;
  description: string;
};

export function useAccountData() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(auth.currentUser);
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const validatePasswordForm = (): boolean => {
    if (!passwordForm.currentPassword) {
      toast.error("Current password is required");
      return false;
    }
    
    if (!passwordForm.newPassword) {
      toast.error("New password is required");
      return false;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords don't match");
      return false;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error("New password must be different from current password");
      return false;
    }
    
    return true;
  };

  const handlePasswordUpdate = async (): Promise<void> => {
    if (!validatePasswordForm() || !user) return;
    
    setLoading(true);
    try {
      // Re-authenticate before changing password
      const credential = EmailAuthProvider.credential(user.email!, passwordForm.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, passwordForm.newPassword);
      toast.success("Password updated successfully");
      
      // Reset form and close dialog
      resetPasswordForm();
      setPasswordDialogOpen(false);
      
    } catch (e: any) {
      let errorMessage = "Password update failed";
      
      switch (e.code) {
        case "auth/wrong-password":
          errorMessage = "Current password is incorrect";
          break;
        case "auth/requires-recent-login":
          errorMessage = "Please sign out and sign in again before changing password";
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection";
          break;
        default:
          errorMessage = e.message || "An unexpected error occurred";
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
      router.replace("/login");
    } catch (e: any) {
      toast.error("Failed to sign out");
    }
  };

  const resetPasswordForm = (): void => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const updatePasswordForm = (field: keyof PasswordFormData, value: string): void => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (timestamp: string | null): string => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleInfo = (): RoleInfo => {
    if (!authUser) {
      return { 
        title: "User", 
        variant: "secondary",
        icon: null,
        description: "Standard user account"
      };
    }
    
    switch (authUser.role) {
      case "siteAdmin":
        return { 
          title: "Site Administrator", 
          variant: "default",
          icon: null,
          description: "Full system access across all venues"
        };
      case "venueAdmin":
        return { 
          title: "Venue Administrator", 
          variant: "secondary",
          icon: null,
          description: "Manage events and staff for your venue"
        };
      case "subAdmin":
        return { 
          title: "Sub Administrator", 
          variant: "outline",
          icon: null,
          description: "Assist with venue management tasks"
        };
      default:
        return { 
          title: "User", 
          variant: "secondary",
          icon: null,
          description: "Standard user account"
        };
    }
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: "", color: "" };
    
    let score = 0;
    let feedback = [];
    
    // Length check
    if (password.length >= 8) score += 25;
    else feedback.push("at least 8 characters");
    
    // Uppercase check
    if (/[A-Z]/.test(password)) score += 25;
    else feedback.push("uppercase letter");
    
    // Lowercase check
    if (/[a-z]/.test(password)) score += 25;
    else feedback.push("lowercase letter");
    
    // Number or special character
    if (/[\d\W]/.test(password)) score += 25;
    else feedback.push("number or special character");
    
    if (score <= 25) return { strength: score, label: "Weak", color: "text-red-500" };
    if (score <= 50) return { strength: score, label: "Fair", color: "text-yellow-500" };
    if (score <= 75) return { strength: score, label: "Good", color: "text-blue-500" };
    return { strength: score, label: "Strong", color: "text-green-500" };
  };

  return {
    user,
    authUser,
    passwordForm,
    loading,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordDialogOpen,
    setPasswordDialogOpen,
    handlePasswordUpdate,
    handleSignOut,
    resetPasswordForm,
    updatePasswordForm,
    formatDate,
    getRoleInfo,
    getPasswordStrength
  };
}